// ─────────────────────────────────────────────────────────────────
//  services/documentos.service.ts
//  AUDITORÍA-VULN-003 + RGPD Art. 9 FIX:
//  Persistencia real de documentos y firmas en Supabase.
//
//  Tablas: patient_documents + document_signatures
//  (ver docs/sql/create_document_signatures.sql)
// ─────────────────────────────────────────────────────────────────

import { dbSelect, dbInsert, dbUpdate, isDbConfigured, generateId } from './db';
import { logAudit } from './audit.service';
import { logger } from './logger';

// ── Tipos ──────────────────────────────────────────────────────────

export type DocumentoTipo = 'RGPD' | 'Consentimiento' | 'Presupuesto' | 'Instrucciones';
export type DocumentoEstado = 'Pendiente' | 'Firmado' | 'Caducado' | 'Revocado';
export type FirmanteTipo = 'paciente' | 'tutor_legal' | 'profesional';
export type MetodoFirma = 'biometrico' | 'checkbox_aceptacion' | 'firma_digital';

export interface PatientDocument {
    id: string;
    num_pac: string;
    titulo: string;
    tipo: DocumentoTipo;
    template_id: string;
    estado: DocumentoEstado;
    contenido_hash?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentSignature {
    id: string;
    document_id: string;
    num_pac: string;
    firmante_nombre: string;
    firmante_tipo: FirmanteTipo;
    metodo_firma: MetodoFirma;
    ip_firmante?: string;
    user_agent?: string;
    consentimiento_leido: boolean;
    timestamp_firma: string;
    profesional_email?: string;
    hash_firma?: string;
}

// ── Helpers ────────────────────────────────────────────────────────

/** Genera un hash simple (no criptográfico) del contenido para integridad */
const simpleHash = async (input: string): Promise<string> => {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        return generateId(); // Fallback si crypto.subtle no está disponible
    }
};

// ── Documentos ────────────────────────────────────────────────────

/**
 * Carga todos los documentos de un paciente desde Supabase.
 * Fallback a array vacío si BD no está configurada.
 */
export const getDocumentosByPaciente = async (numPac: string): Promise<PatientDocument[]> => {
    if (!isDbConfigured() || !numPac) return [];
    try {
        const rows = await dbSelect<PatientDocument>('patient_documents', {
            num_pac: `eq.${numPac}`,
            order: 'created_at.desc',
        });
        return rows;
    } catch (e) {
        logger.error('[Documentos] getDocumentosByPaciente error:', e);
        return [];
    }
};

/**
 * Crea un nuevo documento para un paciente (estado: Pendiente).
 */
export const crearDocumento = async (params: {
    numPac: string;
    titulo: string;
    tipo: DocumentoTipo;
    templateId: string;
    createdBy: string;
    contenido?: string;
}): Promise<PatientDocument | null> => {
    if (!isDbConfigured()) {
        // Modo demo: devolver objeto simulado
        return {
            id: generateId(),
            num_pac: params.numPac,
            titulo: params.titulo,
            tipo: params.tipo,
            template_id: params.templateId,
            estado: 'Pendiente',
            created_by: params.createdBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    try {
        const contenidoHash = params.contenido
            ? await simpleHash(params.contenido) : undefined;

        const doc = await dbInsert<PatientDocument>('patient_documents', {
            num_pac: params.numPac,
            titulo: params.titulo,
            tipo: params.tipo,
            template_id: params.templateId,
            estado: 'Pendiente',
            contenido_hash: contenidoHash,
            created_by: params.createdBy,
        } as Partial<PatientDocument>);

        if (doc) {
            logAudit({
                action: 'SIGN_DOCUMENT',
                entity_type: 'patient_document',
                entity_id: doc.id,
                details: { titulo: params.titulo, tipo: params.tipo, numPac: params.numPac, accion: 'created' },
            });
        }

        return doc;
    } catch (e) {
        logger.error('[Documentos] crearDocumento error:', e);
        return null;
    }
};

/**
 * AUDITORÍA-VULN-003 FIX:
 * Registra una firma REAL en la tabla document_signatures.
 * Marca el documento como Firmado en patient_documents.
 * Este registro es INMUTABLE (no hay política DELETE en BD).
 */
export const firmarDocumento = async (params: {
    documentId: string;
    numPac: string;
    firmanteNombre: string;
    firmanteTipo: FirmanteTipo;
    metodoFirma: MetodoFirma;
    consentimientoLeido: boolean;
    profesionalEmail?: string;
}): Promise<DocumentSignature | null> => {
    if (!isDbConfigured()) {
        // Modo demo: devolver firma simulada
        logger.warn('[Documentos] BD no configurada — firma solo en memoria (NO persiste)');
        return {
            id: generateId(),
            document_id: params.documentId,
            num_pac: params.numPac,
            firmante_nombre: params.firmanteNombre,
            firmante_tipo: params.firmanteTipo,
            metodo_firma: params.metodoFirma,
            consentimiento_leido: params.consentimientoLeido,
            timestamp_firma: new Date().toISOString(),
            profesional_email: params.profesionalEmail,
        };
    }

    try {
        // Generar hash de integridad de la firma
        const hashInput = `${params.documentId}|${params.firmanteNombre}|${new Date().toISOString()}`;
        const hashFirma = await simpleHash(hashInput);

        // 1. Registrar la firma
        const firma = await dbInsert<DocumentSignature>('document_signatures', {
            document_id: params.documentId,
            num_pac: params.numPac,
            firmante_nombre: params.firmanteNombre,
            firmante_tipo: params.firmanteTipo,
            metodo_firma: params.metodoFirma,
            ip_firmante: undefined, // La IP se registra server-side en Edge Function si se implementa
            user_agent: navigator.userAgent.substring(0, 500),
            consentimiento_leido: params.consentimientoLeido,
            profesional_email: params.profesionalEmail,
            hash_firma: hashFirma,
        } as Partial<DocumentSignature>);

        if (!firma) throw new Error('No se pudo crear el registro de firma');

        // 2. Actualizar estado del documento a Firmado
        await dbUpdate<PatientDocument>('patient_documents', params.documentId, {
            estado: 'Firmado',
        } as Partial<PatientDocument>);

        // 3. Registrar en audit trail (OBLIGATORIO RGPD Art. 30)
        logAudit({
            action: 'SIGN_DOCUMENT',
            entity_type: 'document_signature',
            entity_id: firma.id,
            details: {
                document_id: params.documentId,
                numPac: params.numPac,
                firmante: params.firmanteNombre,
                metodo: params.metodoFirma,
                hash: hashFirma,
            },
        });

        logger.info('[Documentos] Firma registrada correctamente:', firma.id);
        return firma;
    } catch (e) {
        logger.error('[Documentos] firmarDocumento error:', e);
        return null;
    }
};

/**
 * Obtiene el historial de firmas de un documento.
 */
export const getSignaturesByDocument = async (documentId: string): Promise<DocumentSignature[]> => {
    if (!isDbConfigured()) return [];
    try {
        return await dbSelect<DocumentSignature>('document_signatures', {
            document_id: `eq.${documentId}`,
            order: 'timestamp_firma.desc',
        });
    } catch (e) {
        logger.error('[Documentos] getSignaturesByDocument error:', e);
        return [];
    }
};
