// ─────────────────────────────────────────────────────────────────
//  services/inventario.service.ts
//  R1 FIX: La FDW TArticulo en Supabase tiene columnas desincronizadas con
//  SQL Server GELITE. Columnas confirmadas como válidas: IdArticulo, Codigo.
//  El resto (Nombre, SKU, StockFisico, etc.) devuelven 500 en SQL Server.
//
//  SOLUCIÓN PERMANENTE: Ejecutar docs/sql/fix_fdw_tarticulo.sql en
//  Supabase SQL Editor para redefinir TArticulo con las columnas correctas.
//  Hasta entonces, el servicio opera en modo "columnas mínimas" y
//  ofrece stock cero con datos identificativos básicos.
//
//  VLN-003 FIX: updateStock ya NO escribe directamente sobre el FDW
//  (TArticulo → SQL Server GELITE). En su lugar crea un ajuste en la
//  tabla nativa stock_ajustes_pendientes, que actúa como ledger de
//  ajustes y dispara pg_notify para que GELITE lo procese de forma
//  transaccional.
// ─────────────────────────────────────────────────────────────────
import { ItemInventario, Lote } from '../types';
import { dbSelect, dbInsert, dbDelete, isDbConfigured } from './db';
import { logAudit } from './audit.service';
import { logger } from './logger';
export { isDbConfigured };

// ── Columnas CONFIRMADAS como válidas en SQL Server ───────────────
// TArticulo: IdArticulo ✅, Codigo ✅
// TArticulo: Nombre ❌, SKU ❌, StockFisico ❌ → error 500
// StckMov: IdMov ❌, Lote ❌, FecCaducidad ❌ → error 500
// ACCIÓN: Solo seleccionar lo que SQL Server acepta.
// SOLUCIÓN PERMANENTE: ejecutar docs/sql/fix_fdw_tarticulo.sql en Supabase SQL Editor.
const TARTICULO_SELECT = 'IdArticulo,Codigo';


interface ItemRowMinimo {
    IdArticulo: string;
    Codigo?: string;
}

interface LoteRowMinimo {
    IdMov?: string;
    IdArticulo?: string;
    Lote?: string;
    FecCaducidad?: string;
    Cantidad?: number;
}

interface AjusteRow {
    id?: string;
    id_articulo: string;
    nombre_articulo?: string;
    stock_anterior?: number;
    stock_nuevo: number;
    motivo: string;
    usuario_email: string;
    usuario_rol: string;
    estado?: string;
    created_at?: string;
}

const rowToItem = (row: ItemRowMinimo, lotes: Lote[]): ItemInventario => ({
    id: String(row.IdArticulo),
    nombre: row.Codigo ?? `Artículo ${row.IdArticulo}`,  // Código como nombre hasta que FDW esté corregida
    sku: row.Codigo ?? String(row.IdArticulo),
    categoria: 'Desechable',
    stockFisico: lotes.reduce((sum, l) => sum + l.cantidad, 0), // Suma desde lotes si disponibles
    stockVirtual: lotes.reduce((sum, l) => sum + l.cantidad, 0),
    minimoReorden: 10,
    lotes,
});

const rowToLote = (row: LoteRowMinimo): Lote => ({
    batchId: String(row.IdMov ?? ''),
    loteFabricante: row.Lote ?? '',
    fechaCaducidad: row.FecCaducidad ?? '',
    cantidad: row.Cantidad ?? 0,
    estado: 'OK',
    ubicacion: 'Almacén Central',
});

export const getInventario = async (): Promise<ItemInventario[]> => {
    if (!isDbConfigured()) return [];
    try {
        // R1 FIX: Solo seleccionamos columnas confirmadas como válidas en SQL Server.
        // Cuando se ejecute fix_fdw_tarticulo.sql, añadir las demás columnas aquí.
        logger.info('[INVENTARIO] Cargando con columnas mínimas FDW: ' + TARTICULO_SELECT);

        const items = await dbSelect<ItemRowMinimo>('TArticulo', {
            select: TARTICULO_SELECT,
            order: 'IdArticulo.asc',
        });

        // StckMov: FDW rota (ninguna columna válida aún) → sin lotes hasta fix_fdw_tarticulo.sql
        const allLotes: LoteRowMinimo[] = [];


        if (items.length === 0) {
            logger.warn('[INVENTARIO] TArticulo devolvió 0 artículos — FDW posiblemente sin datos o con error.');
        }

        // Agrupar lotes por IdArticulo
        const lotesByArticulo = new Map<string, Lote[]>();
        for (const lote of allLotes) {
            if (!lote.IdArticulo) continue;
            const key = String(lote.IdArticulo);
            const arr = lotesByArticulo.get(key) ?? [];
            arr.push(rowToLote(lote));
            lotesByArticulo.set(key, arr);
        }

        return items.map(item =>
            rowToItem(item, lotesByArticulo.get(String(item.IdArticulo)) ?? [])
        );
    } catch (e) {
        logger.error('[INVENTARIO] Error al cargar TArticulo:', e);
        return [];
    }
};

/**
 * VLN-003 FIX: updateStock ya NO escribe directamente sobre FDW TArticulo.
 * Crea un registro en stock_ajustes_pendientes con pg_notify para GELITE.
 */
export const updateStock = async (
    itemId: string,
    stockNuevo: number,
    motivo: string = 'Ajuste manual desde SmileStudio Web',
    stockAnterior?: number,
    nombreArticulo?: string,
    usuarioEmail: string = 'unknown',
    usuarioRol: string = 'admin'
): Promise<boolean> => {
    if (!isDbConfigured()) return true;

    const ajuste = await dbInsert<AjusteRow>('stock_ajustes_pendientes', {
        id_articulo: itemId,
        nombre_articulo: nombreArticulo,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo,
        usuario_email: usuarioEmail,
        usuario_rol: usuarioRol,
        estado: 'pendiente',
    });

    if (!ajuste) return false;

    logAudit({
        action: 'UPDATE_STOCK',
        entity_type: 'inventario',
        entity_id: itemId,
        details: {
            stock_nuevo: stockNuevo,
            stock_anterior: stockAnterior,
            motivo,
            ajuste_id: ajuste.id,
        },
    });

    return true;
};

/** Obtener ajustes de stock pendientes (para panel admin) */
export const getAjustesPendientes = async (): Promise<AjusteRow[]> => {
    if (!isDbConfigured()) return [];
    return dbSelect<AjusteRow>('stock_ajustes_pendientes', {
        estado: 'eq.pendiente',
        order: 'created_at.desc',
        limit: '100',
    });
};

export const addLote = async (itemId: string, lote: Omit<Lote, 'batchId'> & { batchId?: string }): Promise<Lote | null> => {
    const row = await dbInsert<LoteRowMinimo>('StckMov', {
        IdArticulo: itemId,
        Lote: lote.loteFabricante,
        FecCaducidad: lote.fechaCaducidad,
        Cantidad: lote.cantidad,
    });
    return row ? rowToLote(row) : null;
};

export const deleteLote = async (id: string): Promise<boolean> =>
    dbDelete('StckMov', id, 'IdMov');
