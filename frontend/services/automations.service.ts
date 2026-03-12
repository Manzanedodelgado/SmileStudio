// ─────────────────────────────────────────────────────────────────
//  services/automations.service.ts
//  Gestión de reglas de automatización — persiste en Supabase.
//  Tabla: automations_config (ver docs/sql/create_automations.sql)
//
//  Fallback: si BD no responde → devuelve INITIAL_AUTOMATIONS
import { logger } from './logger';
//  para que la UI nunca quede rota.
// ─────────────────────────────────────────────────────────────────
import { dbSelect, dbInsert, dbUpdate, isDbConfigured } from './db';
import { INITIAL_AUTOMATIONS, type Automation } from '../views/ia/AutomationRules';

// ── Tipos internos DB ─────────────────────────────────────────

interface AutomationRow {
    id: string;
    name: string;
    description: string;
    trigger_event: string;
    channel: string;
    category: string;
    active: boolean;
    executions: number;
    success_rate: number;
    timing: string;
    example: string;
    config: Automation['config'];
    created_at?: string;
    updated_at?: string;
}

const rowToAutomation = (row: AutomationRow): Automation => ({
    id: row.id,
    name: row.name,
    description: row.description,
    trigger: row.trigger_event,
    channel: row.channel as Automation['channel'],
    category: row.category as Automation['category'],
    active: row.active,
    executions: row.executions ?? 0,
    successRate: row.success_rate ?? 0,
    timing: row.timing ?? '',
    example: row.example ?? '',
    config: row.config ?? {
        delayValue: 0, delayUnit: 'horas',
        message: '', channel: row.channel, schedule: 'Cualquier hora', conditions: '',
    },
});

const automationToRow = (a: Automation): Omit<AutomationRow, 'created_at' | 'updated_at'> => ({
    id: a.id,
    name: a.name,
    description: a.description,
    trigger_event: a.trigger,
    channel: a.channel,
    category: a.category,
    active: a.active,
    executions: a.executions,
    success_rate: a.successRate,
    timing: a.timing,
    example: a.example,
    config: a.config,
});

// ── Caché en memoria para evitar recargas innecesarias ──────────
let _cache: Automation[] | null = null;
export const invalidateAutomationsCache = () => { _cache = null; };

// ── API pública ───────────────────────────────────────────────

/**
 * Carga las automatizaciones desde BD.
 * Si la BD no está configurada o falla → devuelve INITIAL_AUTOMATIONS (fallback).
 */
export const getAutomations = async (): Promise<Automation[]> => {
    if (_cache) return _cache;
    if (!isDbConfigured()) return INITIAL_AUTOMATIONS;

    try {
        const rows = await dbSelect<AutomationRow>('automations_config', {
            order: 'category.asc,name.asc',
        });

        if (!rows || rows.length === 0) {
            // Primera vez: BD vacía → subimos las automaciones iniciales como semilla
            await seedAutomations(INITIAL_AUTOMATIONS);
            _cache = [...INITIAL_AUTOMATIONS];
            return _cache;
        }

        _cache = rows.map(rowToAutomation);
        return _cache;
    } catch (e) {
        logger.warn('[Automations] BD no disponible, usando datos locales:', e);
        return INITIAL_AUTOMATIONS;
    }
};

/**
 * Guarda (upsert) una automatización completa.
 * Actualiza la caché en memoria automáticamente.
 */
export const saveAutomation = async (automation: Automation): Promise<boolean> => {
    if (!isDbConfigured()) {
        logger.warn('[Automations] BD no configurada — cambio solo en memoria');
        return false;
    }

    try {
        const row = automationToRow(automation);

        // Intentar PATCH primero (si ya existe)
        const existing = await dbSelect<AutomationRow>('automations_config', {
            id: `eq.${automation.id}`,
            limit: '1',
        });

        if (existing && existing.length > 0) {
            await dbUpdate<AutomationRow>('automations_config', automation.id, row as Partial<AutomationRow>, 'id');
        } else {
            await dbInsert<AutomationRow>('automations_config', row as AutomationRow);
        }

        // Actualizar caché
        if (_cache) {
            const idx = _cache.findIndex(a => a.id === automation.id);
            if (idx >= 0) _cache[idx] = automation;
            else _cache.push(automation);
        }

        return true;
    } catch (e) {
        logger.error('[Automations] Error al guardar:', e);
        return false;
    }
};

/**
 * Actualiza solo el estado activo/inactivo de una automatización.
 * Más eficiente que saveAutomation() completo para un simple toggle.
 */
export const toggleAutomation = async (id: string, active: boolean): Promise<boolean> => {
    if (!isDbConfigured()) return false;

    try {
        await dbUpdate<AutomationRow>('automations_config', id, { active } as Partial<AutomationRow>, 'id');

        // Actualizar caché
        if (_cache) {
            const item = _cache.find(a => a.id === id);
            if (item) item.active = active;
        }
        return true;
    } catch (e) {
        logger.error('[Automations] Error al toggle:', e);
        return false;
    }
};

/**
 * Siembra la BD con las automatizaciones por defecto.
 * Solo se llama una vez cuando la tabla está vacía.
 */
const seedAutomations = async (automations: Automation[]): Promise<void> => {
    try {
        for (const a of automations) {
            await dbInsert<AutomationRow>('automations_config', automationToRow(a) as AutomationRow);
        }
        logger.info(`[Automations] Semilla completada: ${automations.length} automatizaciones guardadas`);
    } catch (e) {
        logger.warn('[Automations] Error al sembrar BD:', e);
    }
};
