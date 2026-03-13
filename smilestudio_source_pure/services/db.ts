// ─────────────────────────────────────────────────────────────────
//  services/db.ts [MOCK VERSION COMPLETE - UI ONLY]
// ─────────────────────────────────────────────────────────────────
import { MOCK_CITAS, MOCK_PACIENTE } from './mock_data';

export const isDbConfigured = (): boolean => true;
export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const setSessionToken = (token: string | null) => {
    console.log('[MOCK DB] Session token set:', token);
};

export const fetchWithTimeout = async (url: string, options?: any, timeout = 10000) => {
    console.log(`[MOCK DB] fetchWithTimeout: ${url}`);
    return { ok: true, json: async () => ([]) } as any;
};

export const dbFetch = async (path: string) => {
    console.log(`[MOCK DB] Fetching: ${path}`);
    return { ok: true, json: async () => ([]) };
};

export const dbSelect = async <T>(table: string, params?: any): Promise<T[]> => {
    console.log(`[MOCK DB] SELECT from ${table}`, params);
    if (table === 'DCitas') return MOCK_CITAS as any;
    if (table === 'Pacientes') return [MOCK_PACIENTE] as any;
    return [];
};

export const dbInsert = async <T>(table: string, body: any): Promise<T> => {
    console.log(`[MOCK DB] INSERT into ${table}`, body);
    return { ...body, id: generateId() };
};

export const dbUpsert = async <T>(table: string, body: any): Promise<T> => {
    console.log(`[MOCK DB] UPSERT into ${table}`, body);
    return { ...body, id: body.id || generateId() };
};

export const dbUpdate = async <T>(table: string, id: string, body: any): Promise<T> => {
    console.log(`[MOCK DB] UPDATE ${table} ${id}`, body);
    return { ...body, id };
};

export const dbDelete = async (table: string, id: string): Promise<boolean> => {
    console.log(`[MOCK DB] DELETE ${table} ${id}`);
    return true;
};
