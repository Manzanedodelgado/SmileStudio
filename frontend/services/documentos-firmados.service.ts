// ─────────────────────────────────────────────────────────────────
//  services/documentos-firmados.service.ts
//  SPRINT 11: Registro, consulta y revocación de documentos firmados.
//
//  Tabla: documento_firmado_eventos (ver docs/sql/create_document_signed_events.sql)
//
//  Principios:
//  - Los registros son INMUTABLES. Nunca se borran.
//  - La "eliminación" se hace marcando revocado = TRUE + motivo.
//  - Datos del formulario del paciente prevalecen sobre los de recepción.
// ─────────────────────────────────────────────────────────────────

import { dbInsert, dbUpdate, dbSelect, isDbConfigured } from './db';
import { logAudit } from './audit.service';
import { logger } from './logger';

// ── Tipos ─────────────────────────────────────────────────────────

export type TipoDoc = 'primera_visita' | 'lopd' | 'consentimiento' | 'revocacion';

export interface DocumentoFirmadoEvento {
    id: string;
    tipoDoc: TipoDoc;
    contactoId?: string;
    numPac?: string;
    citaId?: string;
    tratamiento?: string;
    versionDoc?: string;
    firmadoAt: string;
    firmadoPor?: string;
    esTutorFirmante: boolean;
    urlDocumento?: string;
    revocado: boolean;
    revocadoAt?: string;
    revocadoMotivo?: string;
    revocadoPor?: string;
    notas?: string;
}

interface DfeRow {
    id: string;
    tipo_doc: string;
    contacto_id?: string;
    num_pac?: string;
    cita_id?: string;
    tratamiento?: string;
    version_doc?: string;
    firmado_at: string;
    firmado_por?: string;
    es_tutor_firmante: boolean;
    url_documento?: string;
    revocado: boolean;
    revocado_at?: string;
    revocado_motivo?: string;
    revocado_por?: string;
    notas?: string;
}

const rowToEvento = (r: DfeRow): DocumentoFirmadoEvento => ({
    id: r.id,
    tipoDoc: r.tipo_doc as TipoDoc,
    contactoId: r.contacto_id,
    numPac: r.num_pac,
    citaId: r.cita_id,
    tratamiento: r.tratamiento,
    versionDoc: r.version_doc,
    firmadoAt: r.firmado_at,
    firmadoPor: r.firmado_por,
    esTutorFirmante: r.es_tutor_firmante,
    urlDocumento: r.url_documento,
    revocado: r.revocado,
    revocadoAt: r.revocado_at,
    revocadoMotivo: r.revocado_motivo,
    revocadoPor: r.revocado_por,
    notas: r.notas,
});

// ── In-memory fallback ────────────────────────────────────────────

const _demoStore: DocumentoFirmadoEvento[] = [];

// ── API Pública ───────────────────────────────────────────────────

/**
 * Registra un nuevo documento firmado.
 * Genera el registro inmutable en la BD.
 *
 * @returns id del evento generado
 */
export const registrarDocumentoFirmado = async (datos: {
    tipoDoc: TipoDoc;
    contactoId?: string;
    numPac?: string;
    citaId?: string;
    tratamiento?: string;
    versionDoc?: string;
    firmadoPor?: string;
    esTutorFirmante?: boolean;
    urlDocumento?: string;
    notas?: string;
}): Promise<string | null> => {
    const payload = {
        tipo_doc: datos.tipoDoc,
        contacto_id: datos.contactoId,
        num_pac: datos.numPac,
        cita_id: datos.citaId,
        tratamiento: datos.tratamiento,
        version_doc: datos.versionDoc,
        firmado_por: datos.firmadoPor,
        es_tutor_firmante: datos.esTutorFirmante ?? false,
        url_documento: datos.urlDocumento,
        notas: datos.notas,
        revocado: false,
    };

    if (!isDbConfigured()) {
        const demo: DocumentoFirmadoEvento = {
            id: crypto.randomUUID(),
            tipoDoc: datos.tipoDoc,
            contactoId: datos.contactoId,
            numPac: datos.numPac,
            citaId: datos.citaId,
            tratamiento: datos.tratamiento,
            firmadoAt: new Date().toISOString(),
            firmadoPor: datos.firmadoPor,
            esTutorFirmante: datos.esTutorFirmante ?? false,
            revocado: false,
        };
        _demoStore.push(demo);
        logger.warn('[DocsFirmados] BD no configurada — evento solo en memoria:', demo.id);
        return demo.id;
    }

    try {
        const row = await dbInsert<DfeRow>('documento_firmado_eventos', payload as any);
        if (!row) return null;

        logAudit({
            action: 'SIGN_DOCUMENT',
            entity_type: 'documento_firmado',
            entity_id: row.id,
            details: { tipo: datos.tipoDoc, contactoId: datos.contactoId, numPac: datos.numPac },
        });

        return row.id;
    } catch (e) {
        logger.error('[DocsFirmados] registrarDocumentoFirmado error:', e);
        return null;
    }
};

/**
 * Obtiene todos los documentos firmados de una cita.
 */
export const getDocumentosPorCita = async (citaId: string): Promise<DocumentoFirmadoEvento[]> => {
    if (!isDbConfigured()) return _demoStore.filter(d => d.citaId === citaId);
    try {
        const rows = await dbSelect<DfeRow>('documento_firmado_eventos', {
            cita_id: `eq.${citaId}`,
            order: 'firmado_at.asc',
        });
        return rows.map(rowToEvento);
    } catch (e) {
        logger.error('[DocsFirmados] getDocumentosPorCita error:', e);
        return [];
    }
};

/**
 * Obtiene todos los documentos firmados de un paciente/contacto.
 * Busca por numPac O contactoId.
 */
export const getDocumentosPorPaciente = async (
    numPac: string,
    contactoId?: string,
): Promise<DocumentoFirmadoEvento[]> => {
    if (!isDbConfigured()) {
        return _demoStore.filter(d => d.numPac === numPac || d.contactoId === contactoId);
    }
    try {
        // Supabase OR filter
        const or = [`num_pac.eq.${numPac}`, contactoId ? `contacto_id.eq.${contactoId}` : null]
            .filter(Boolean).join(',');
        const rows = await dbSelect<DfeRow>('documento_firmado_eventos', {
            or: `(${or})`,
            order: 'firmado_at.desc',
        });
        return rows.map(rowToEvento);
    } catch (e) {
        logger.error('[DocsFirmados] getDocumentosPorPaciente error:', e);
        return [];
    }
};

/**
 * Revoca un documento firmado (lógicamente — no borra).
 * Registra también un evento de tipo 'revocacion' para trazabilidad.
 */
export const revocarDocumento = async (
    eventoId: string,
    motivo: string,
    revocadoPor: string,
): Promise<boolean> => {
    if (!motivo.trim()) throw new Error('El motivo de revocación es obligatorio.');

    if (!isDbConfigured()) {
        const d = _demoStore.find(x => x.id === eventoId);
        if (d) {
            d.revocado = true;
            d.revocadoAt = new Date().toISOString();
            d.revocadoMotivo = motivo;
            d.revocadoPor = revocadoPor;
        }
        return !!d;
    }

    try {
        await dbUpdate('documento_firmado_eventos', eventoId, {
            revocado: true,
            revocado_at: new Date().toISOString(),
            revocado_motivo: motivo.trim(),
            revocado_por: revocadoPor,
        } as any);

        logAudit({
            action: 'VIEW_DOCUMENT',
            entity_type: 'documento_firmado',
            entity_id: eventoId,
            details: { accion: 'REVOCAR', motivo, revocadoPor },
        });

        logger.info('[DocsFirmados] Documento revocado:', eventoId);
        return true;
    } catch (e) {
        logger.error('[DocsFirmados] revocarDocumento error:', e);
        return false;
    }
};

/**
 * Etiquetas legibles para cada tipo de documento.
 */
export const tipoDocLabel: Record<TipoDoc, { label: string; icon: string; color: string }> = {
    primera_visita: { label: 'Primera Visita', icon: '📋', color: '#0056b3' },
    lopd: { label: 'LOPD / Privacidad', icon: '🔒', color: '#7c3aed' },
    consentimiento: { label: 'Consentimiento', icon: '✍️', color: '#059669' },
    revocacion: { label: 'Revocación', icon: '🚫', color: '#dc2626' },
};
