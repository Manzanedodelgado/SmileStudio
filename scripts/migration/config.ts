import sql from 'mssql';

export const gesdenConfig: sql.config = {
    server: 'bbddsql.servemp3.com',
    port: 1433,
    database: 'GELITE',
    user: 'SmileStudio',
    password: 'SmileStudio2026!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 60000,
    requestTimeout: 120000,
};

export function log(phase: string, msg: string) {
    console.log(`[${new Date().toISOString()}] [${phase}] ${msg}`);
}

// ─── Field mappings (provided by client) ─────────────────────────────────────

export function mapIdUsu(idUsu: number | null): string {
    switch (idUsu) {
        case 3: return 'Dr. Mario Rubio';
        case 4: return 'Dra. Irene Garcia';
        case 8: return 'Dra. Virginia Tresgallo';
        case 10: return 'Dra. Miriam Carrasco';
        case 12: return 'Tc. Juan Antonio Manzanedo';
        case 13: return 'Dr. Ignacio Ferrero';
        default: return 'Odontologo';
    }
}

export function mapIdSitC(idSitC: number | null): string {
    switch (idSitC) {
        case 0: return 'Planificada';
        case 1: return 'Anulada';
        case 5: return 'Finalizada';
        case 7: return 'Confirmada';
        case 8: return 'Cancelada';
        default: return 'Desconocido';
    }
}

export function mapIdIcono(idIcono: number | null): string {
    switch (idIcono) {
        case 1: return 'Control';
        case 2: return 'Urgencia';
        case 3: return 'Protesis Fija';
        case 4: return 'Cirugia/Injerto';
        case 6: return 'Retirar Ortodoncia';
        case 7: return 'Protesis Removible';
        case 8: return 'Colocacion Ortodoncia';
        case 9: return 'Periodoncia';
        case 10: return 'Cirugia de Implante';
        case 11: return 'Mensualidad Ortodoncia';
        case 12: return 'Ajuste Prot/tto';
        case 13: return 'Primera Visita';
        case 14: return 'Higiene Dental';
        case 15: return 'Endodoncia';
        case 16: return 'Reconstruccion';
        case 17: return 'Exodoncia';
        case 18: return 'Estudio Ortodoncia';
        case 19: return 'Rx/escaner';
        default: return 'Otros';
    }
}

// Fecha: días desde 1899-12-30 → Date
export function mapFecha(fecha: number | null): Date | null {
    if (fecha === null || fecha === undefined) return null;
    const base = new Date(1899, 11, 30); // 1899-12-30
    base.setDate(base.getDate() + fecha - 2);
    return base;
}

// Hora: segundos desde medianoche → "HH:MM"
export function mapHora(hora: number | null): string | null {
    if (hora === null || hora === undefined) return null;
    const h = Math.floor(hora / 3600);
    const m = Math.floor((hora % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Duracion: segundos → minutos
export function mapDuracion(duracion: number | null): number | null {
    if (duracion === null || duracion === undefined) return null;
    return Math.floor(duracion / 60);
}

// Texto: "APELLIDOS, Nombre" → { apellidos, nombre }
export function mapTexto(texto: string | null): { apellidos: string | null; nombre: string | null } {
    if (!texto) return { apellidos: null, nombre: null };
    const idx = texto.indexOf(',');
    if (idx > 0) {
        return {
            apellidos: texto.substring(0, idx).trim(),
            nombre: texto.substring(idx + 1).trim(),
        };
    }
    return { apellidos: null, nombre: texto.trim() };
}
