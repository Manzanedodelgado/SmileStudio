// ─────────────────────────────────────────────────────────────────
//  services/pacientes.service.ts
//  CRUD completo de pacientes contra Supabase → tabla "Pacientes".
//  Búsqueda por NumPac, Nombre, Apellidos, NIF, TelMovil.
// ─────────────────────────────────────────────────────────────────
import { Paciente } from '../types';
import { dbSelect, dbInsert, dbUpdate, dbDelete, isDbConfigured, generateId } from './db';
import { logger } from './logger';

// Tipo interno de BD (PascalCase heredado de GELITE)
interface PacienteRow {
    IdPac?: number;
    NumPac?: string;
    Nombre?: string;
    Apellidos?: string;
    NIF?: string;
    Tel1?: string;
    Tel2?: string;
    TelMovil?: string;
    Email?: string;
    FecNacim?: string;
    Direccion?: string;
    CP?: string;
    Observaciones?: string;
    Notas?: string;
}

/** Convierte fila de BD al tipo Paciente del frontend */
const rowToPaciente = (row: PacienteRow): Paciente => ({
    numPac: row.NumPac ?? String(row.IdPac ?? ''),
    idPac: row.IdPac,          // ← guardamos el IdPac GELITE para queries directas
    nombre: row.Nombre ?? '',
    apellidos: row.Apellidos ?? '',
    dni: row.NIF ?? '',
    telefono: row.TelMovil ?? row.Tel1 ?? row.Tel2 ?? '',
    fechaNacimiento: row.FecNacim ?? '',
    tutor: undefined,
    alergias: [],
    medicacionActual: undefined,
    deuda: false,
    historial: [],
    consentimientosFirmados: false,
});

const pacienteToRow = (p: Partial<Paciente>): Partial<PacienteRow> => ({
    NumPac: p.numPac,
    Nombre: p.nombre,
    Apellidos: p.apellidos,
    NIF: p.dni,
    TelMovil: p.telefono,
    FecNacim: p.fechaNacimiento,
    Observaciones: p.tutor ? `Tutor: ${p.tutor}` : undefined,
});

// ── Caché de pacientes (FDW no soporta ilike) ───────────────────
let _pacientesCache: Paciente[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/** Carga todos los pacientes paginando (FDW limita a 1000 por query) */
const loadAllPacientes = async (): Promise<Paciente[]> => {
    if (_pacientesCache && Date.now() - _cacheTime < CACHE_TTL) return _pacientesCache;
    if (!isDbConfigured()) return [];

    const PAGE_SIZE = 1000;
    let all: Paciente[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const rows = await dbSelect<PacienteRow>('Pacientes', {
            select: 'IdPac,NumPac,Nombre,Apellidos,NIF,TelMovil,Tel1,Tel2',
            order: 'NumPac.asc',
            offset: String(offset),
            limit: String(PAGE_SIZE),
        });
        all.push(...rows.map(rowToPaciente));
        hasMore = rows.length === PAGE_SIZE;
        offset += PAGE_SIZE;
    }

    logger.info(`[PACIENTES] Caché cargada: ${all.length} pacientes`);
    _pacientesCache = all;
    _cacheTime = Date.now();
    return _pacientesCache;
};

/**
 * Busca pacientes por:
 *   NumPac, Nombre, Apellidos, NIF, TelMovil
 * Filtra client-side porque MSSQL FDW no soporta ilike.
 */
export const searchPacientes = async (query: string): Promise<Paciente[]> => {
    const all = await loadAllPacientes();
    if (!query.trim()) return all.slice(0, 30);

    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/);

    return all.filter(p => {
        const haystack = [
            p.numPac,
            p.nombre,
            p.apellidos,
            p.dni,
            p.telefono,
        ].join(' ').toLowerCase();
        return terms.every(t => haystack.includes(t));
    }).slice(0, 50);
};

export const getPaciente = async (numPac: string): Promise<Paciente | null> => {
    if (!isDbConfigured()) return null;
    const rows = await dbSelect<PacienteRow>('Pacientes', {
        NumPac: `eq.${numPac}`,
        select: 'IdPac,NumPac,Nombre,Apellidos,NIF,TelMovil,Tel1,Tel2',
        order: 'NumPac.asc',
        limit: '1',
    });
    return rows[0] ? rowToPaciente(rows[0]) : null;
};

// ── Validación (SEC-A03 FIX) ──────────────────────────────────────

export interface ValidationError { field: string; message: string; }

export const validatePaciente = (p: Partial<Omit<Paciente, 'historial'>>): ValidationError[] => {
    const errs: ValidationError[] = [];

    if (!p.nombre?.trim())
        errs.push({ field: 'nombre', message: 'El nombre es obligatorio' });
    else if (p.nombre.trim().length < 2)
        errs.push({ field: 'nombre', message: 'Nombre: mínimo 2 caracteres' });
    else if (p.nombre.length > 100)
        errs.push({ field: 'nombre', message: 'Nombre: máximo 100 caracteres' });

    if (!p.apellidos?.trim())
        errs.push({ field: 'apellidos', message: 'Los apellidos son obligatorios' });
    else if (p.apellidos.trim().length < 2)
        errs.push({ field: 'apellidos', message: 'Apellidos: mínimo 2 caracteres' });
    else if (p.apellidos.length > 150)
        errs.push({ field: 'apellidos', message: 'Apellidos: máximo 150 caracteres' });

    if (!p.telefono?.trim())
        errs.push({ field: 'telefono', message: 'El teléfono es obligatorio' });
    else if (!/^\+?[0-9\s\-()]{7,20}$/.test(p.telefono))
        errs.push({ field: 'telefono', message: 'Teléfono: formato inválido' });

    if (p.dni?.trim()) {
        const nif = p.dni.trim().toUpperCase();
        const validNif = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(nif)
            || /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(nif)
            || /^[A-Z]{2}[A-Z0-9]{6,9}$/.test(nif);
        if (!validNif) errs.push({ field: 'dni', message: 'NIF/DNI/NIE: formato inválido' });
    }

    if (p.medicacionActual && p.medicacionActual.length > 1000)
        errs.push({ field: 'medicacionActual', message: 'Medicación: máximo 1000 caracteres' });

    return errs;
};

export const createPaciente = async (p: Omit<Paciente, 'historial'>): Promise<Paciente | null> => {
    const errors = validatePaciente(p);
    if (errors.length > 0) {
        logger.warn('[PACIENTES] createPaciente — datos inválidos:', errors);
        throw new Error(`Datos inválidos: ${errors.map(e => e.message).join(', ')}`);
    }
    const sanitized: Omit<Paciente, 'historial'> = {
        ...p,
        nombre: p.nombre.trim().replace(/\s{2,}/g, ' '),
        apellidos: p.apellidos.trim().replace(/\s{2,}/g, ' '),
        telefono: p.telefono.trim(),
        dni: p.dni?.trim().toUpperCase() ?? '',
    };
    const row = await dbInsert<PacienteRow>('Pacientes', pacienteToRow(sanitized));
    return row ? rowToPaciente(row) : null;
};

/** Actualiza datos de un paciente existente */
export const updatePaciente = async (
    numPac: string,
    updates: Partial<Omit<Paciente, 'historial'>>
): Promise<Paciente | null> => {
    const row = await dbUpdate<PacienteRow>('Pacientes', numPac, pacienteToRow(updates), 'NumPac');
    return row ? rowToPaciente(row) : null;
};

export const deletePaciente = async (numPac: string): Promise<boolean> =>
    dbDelete('Pacientes', numPac, 'NumPac');

export { isDbConfigured };
