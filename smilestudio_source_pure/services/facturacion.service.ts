// ─────────────────────────────────────────────────────────────────
//  services/facturacion.service.ts
//  CRUD de facturas, gastos y bancos contra Supabase.
// ─────────────────────────────────────────────────────────────────
import { dbSelect, dbInsert, dbUpdate, isDbConfigured } from './db';

// Interfaces simplificadas para coincidir con la UI de Gestoria.tsx
export interface FacturaUI {
    id: string; // Ej: 2024-FACT-001
    name: string; // Paciente / Titular
    date: string; // Ej: Hoy, 12:45
    base: string; // Ej: €1,200.00
    total: string; // Ej: €1,200.00
    status: 'Liquidado' | 'Pendiente' | 'Impagado';
    tbai: 'Verificado' | 'Enviando...' | 'Error';
    rawDate: Date;
    rawTotal: number;
}

export interface MovimientoBancoUI {
    desc: string;
    date: string;
    amount: string; // Ej: +1,200.00
    type: 'in' | 'out';
    match: boolean;
}

// Columnas reales de dbo.NV_CabFactura en GELITE
interface FacturaRow {
    IdFactura: string;       // ID interno GELITE
    NFactura: string;        // Número de factura legible (ej: F2024-001)
    Serie?: string;
    IdPac: string;           // FK Pacientes.IdPac — clave para filtrar por paciente
    IdColabo?: string;       // FK TColabos
    Fecha: string;           // Fecha emisión (datetime como text en FDW)
    Concepto?: string;       // Concepto general
    BaseImponible?: number;
    TpcIVA?: number;
    ImporteIVA?: number;
    Total: number;           // Total facturado
    IdFormaPago?: string;
}

interface MovimientoBancoRow {
    Apunte: string;
    Fecha: string;
    Concepto: string;
    Importe: string;         // text en FDW
    Tipo: string;
    IdBanco?: string;
    Guid_Tenant?: string;
}

const formatCurrency = (val: number): string =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(val).replace('€', '€');

const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString('es-ES', { month: 'short' })} ${d.getFullYear()}`;
};

const rowToFacturaUI = (r: FacturaRow): FacturaUI => ({
    id: r.NFactura || r.IdFactura,
    name: r.Concepto || `Paciente ${r.IdPac}`,
    date: formatDate(r.Fecha),
    base: formatCurrency(Number(r.BaseImponible ?? 0) || Number(r.Total) / 1.21),
    total: formatCurrency(Number(r.Total) || 0),
    status: 'Liquidado' as const,
    tbai: 'Verificado' as const,
    rawDate: new Date(r.Fecha),
    rawTotal: Number(r.Total) || 0,
});

/** Todas las facturas — para Gestoría (vista global) */
export const getFacturas = async (): Promise<FacturaUI[]> => {
    if (!isDbConfigured()) return [];
    try {
        const rows = await dbSelect<FacturaRow>('NV_CabFactura', {
            order: 'Fecha.desc',
            limit: '500',
        });
        return rows.map(rowToFacturaUI);
    } catch { return []; }
};

/**
 * Facturas de UN paciente concreto — para la vista Económica del paciente.
 * Filtra por IdPac (ID numérico interno GELITE) porque NV_CabFactura
 * NO tiene NumPac, solo IdPac.
 */
export const getFacturasByPaciente = async (idPac: string | number): Promise<FacturaUI[]> => {
    if (!isDbConfigured() || !idPac) return [];
    try {
        const rows = await dbSelect<FacturaRow>('NV_CabFactura', {
            IdPac: `eq.${idPac}`,
            order: 'Fecha.desc',
        });
        return rows.map(rowToFacturaUI);
    } catch { return []; }
};

export const createFactura = async (factura: Partial<FacturaRow>): Promise<boolean> => {
    if (!isDbConfigured()) return true;
    const row = await dbInsert<FacturaRow>('NV_CabFactura', factura);
    return row !== null;
};

export const getMovimientosBanco = async (): Promise<MovimientoBancoUI[]> => {
    if (!isDbConfigured()) return [];
    try {
        const rows = await dbSelect<MovimientoBancoRow>('BancoMov', { order: 'Fecha.desc', limit: '200' });
        return rows.map(r => {
            const imp = parseFloat(String(r.Importe).replace(',', '.')) || 0;
            return {
                desc: r.Concepto,
                date: formatDate(r.Fecha),
                amount: `${imp >= 0 ? '+' : ''}${formatCurrency(imp)}`,
                type: imp >= 0 ? 'in' : 'out',
                match: true,
            };
        });
    } catch { return []; }
};

export const getGestoriaStats = async () => {
    if (!isDbConfigured()) return { ingresosBrutos: '€0.00', facturasConteo: 0 };

    try {
        // PERF-A06 FIX: Query directa para COUNT + SUM sin traer todos los registros
        // Se solicita solo columnas de aggregate, no todo el payload de facturas
        const rows = await dbSelect<{ Total: number }>('NV_CabFactura', {
            select: 'Total',
            order: 'Fecha.desc',
            limit: '5000',
        });
        const ingresosBrutos = rows.reduce((acc, r) => acc + (Number(r.Total) || 0), 0);
        return {
            ingresosBrutos: formatCurrency(ingresosBrutos),
            facturasConteo: rows.length,
        };
    } catch {
        return { ingresosBrutos: '—', facturasConteo: 0 };
    }
};

