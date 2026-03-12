// ─────────────────────────────────────────────────────────────────
//  services/questionnaire.service.ts
//  SPRINT 6: Cuestionario de Primera Visita (Anamnesis Digital).
//
//  Flujo:
//  1. Al crear cita para paciente nuevo → crearQuestionnaireToken()
//  2. Sistema envía link vía WhatsApp: /cuestionario?token=XXX
//  3. Paciente rellena el formulario (sin login)
//  4. Al completar → guardarRespuestasQuestionnaire()
//  5. Datos se vuelcan en la ficha del paciente automáticamente
//
//  Tabla: primera_visita_questionnaire
//  (ver docs/sql/create_questionnaire.sql)
// ─────────────────────────────────────────────────────────────────

import { dbInsert, dbUpdate, dbSelect, isDbConfigured, generateId } from './db';
import { logAudit } from './audit.service';
import { logger } from './logger';

// ── Tipos ──────────────────────────────────────────────────────────

export interface QuestionnaireData {
    // Sección 1: General
    fechaNacimiento?: string;
    sexo?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no indicar';
    profesion?: string;

    // Sección 2: Motivo de consulta
    motivoConsulta?: string;
    ultimaVisitaDentista?: '< 6 meses' | '6-12 meses' | '1-2 años' | '> 2 años' | 'Nunca';

    // Sección 3: Salud general
    enfermedadCardiaca?: boolean;
    hipertension?: boolean;
    diabetes?: 'No' | 'Tipo 1' | 'Tipo 2' | 'Prediabetes';
    asmaCopd?: boolean;
    cancer?: boolean;
    embarazo?: boolean;
    semanasEmbarazo?: number;
    otrasEnfermedades?: string;

    // Sección 4: Medicación
    tomaMedicacion?: boolean;
    listaMedicacion?: string;
    anticoagulantes?: boolean;
    bisfosfonatos?: boolean;  // ⚠️ Crítico: contraindicación para implantes/cirugía
    antibioticosActuales?: boolean;

    // Sección 5: Alergias
    alergiaPenicilina?: boolean;
    alergiaAspirina?: boolean;
    alergiaIbuprofeno?: boolean;
    alergiaAnestesia?: boolean;
    alergiaLatex?: boolean;
    alergiaMetal?: boolean;
    otrasAlergias?: string;

    // Sección 6: Hábitos
    fumador?: 'No' | 'Ocasional' | 'Diario' | 'Ex-fumador';
    alcohol?: 'No' | 'Ocasional' | 'Frecuente';
    bruxismo?: boolean;
    higieneOral?: '1 vez/día' | '2 veces/día' | '3 veces/día';
    usaHiloDental?: boolean;
    usaEnjuague?: boolean;

    // Sección 7: Historial dental
    extracciones?: boolean;
    endodoncias?: boolean;
    implantes?: boolean;
    ortodoncia?: boolean;
    protesis?: 'No' | 'Parcial removible' | 'Total removible' | 'Fija';
    miedosDentista?: string;

    // Sección 8: Consentimiento
    aceptaPoliticaPrivacidad: boolean;
    aceptaTratamientoDatos: boolean;
}

export interface QuestionnaireRecord {
    id: string;
    num_pac?: string;       // Nullable: se llena al convertir en paciente
    contacto_id?: string;   // Alternativa: cuestionario vinculado a contacto sin NumPac
    token: string;
    estado: 'pendiente' | 'completado' | 'expirado';
    expires_at: string;
    completado_at?: string;
    created_at: string;
}

// ── API ────────────────────────────────────────────────────────────

/**
 * Crea un token de cuestionario para un contacto (sin NumPac) o paciente existente.
 * El token expira 1h después de la cita.
 *
 * @param entityId   - contacto_id (UUID) si es primera visita, numPac si ya es paciente
 * @param fechaCita  - fecha de la cita
 * @param entityType - 'contacto' | 'paciente' (default: 'paciente')
 * @returns URL completa para enviar al paciente/contacto
 */
export const crearQuestionnaireToken = async (
    entityId: string,
    fechaCita: Date,
    entityType: 'contacto' | 'paciente' = 'paciente',
): Promise<string | null> => {
    const token = generateId().replace(/-/g, '') + generateId().replace(/-/g, '').substring(0, 8);
    const expiresAt = new Date(fechaCita.getTime() + 60 * 60 * 1000);

    if (!isDbConfigured()) {
        logger.warn('[Questionnaire] BD no configurada — token solo local:', token);
        return `${window.location.origin}/?token=${token}`;
    }

    try {
        const insertPayload = entityType === 'contacto'
            ? { contacto_id: entityId, token, estado: 'pendiente', expires_at: expiresAt.toISOString() }
            : { num_pac: entityId, token, estado: 'pendiente', expires_at: expiresAt.toISOString() };

        const record = await dbInsert<QuestionnaireRecord>('primera_visita_questionnaire', insertPayload as any);
        if (!record) return null;

        logAudit({
            action: 'GENERATE_DOCUMENT',
            entity_type: 'questionnaire',
            entity_id: record.id,
            details: { entityId, entityType, token: token.substring(0, 8) + '...', expires: expiresAt.toISOString() },
        });

        const baseUrl = (import.meta as any).env?.VITE_APP_URL ?? window.location.origin;
        return `${baseUrl}/?token=${token}`;
    } catch (e) {
        logger.error('[Questionnaire] crearQuestionnaireToken error:', e);
        return null;
    }
};

/**
 * Busca el cuestionario por token (sin autenticación — acceso desde link).
 */
export const getQuestionnaireByToken = async (token: string): Promise<QuestionnaireRecord | null> => {
    if (!isDbConfigured()) return null;
    try {
        const rows = await dbSelect<QuestionnaireRecord>('primera_visita_questionnaire', {
            token: `eq.${token}`,
            estado: 'eq.pendiente',
        });
        return rows[0] ?? null;
    } catch (e) {
        logger.error('[Questionnaire] getQuestionnaireByToken error:', e);
        return null;
    }
};

/**
 * Guarda las respuestas del cuestionario y marca como completado.
 * Mapea los campos camelCase del frontend a snake_case de la BD.
 */
export const guardarRespuestasQuestionnaire = async (
    token: string,
    data: QuestionnaireData,
): Promise<boolean> => {
    if (!isDbConfigured()) {
        logger.warn('[Questionnaire] BD no configurada — respuestas no guardadas');
        return false;
    }

    const record = await getQuestionnaireByToken(token);
    if (!record) {
        logger.warn('[Questionnaire] Token inválido o ya completado:', token.substring(0, 8));
        return false;
    }

    // Verificar expiración
    if (new Date(record.expires_at) < new Date()) {
        logger.warn('[Questionnaire] Token expirado:', token.substring(0, 8));
        return false;
    }

    try {
        const updatePayload = {
            estado: 'completado',
            completado_at: new Date().toISOString(),
            ip_paciente: undefined, // Se captura server-side
            user_agent: navigator.userAgent.substring(0, 500),
            // Sección 1
            fecha_nacimiento: data.fechaNacimiento,
            sexo: data.sexo,
            profesion: data.profesion,
            // Sección 2
            motivo_consulta: data.motivoConsulta,
            ultima_visita_dentista: data.ultimaVisitaDentista,
            // Sección 3
            enfermedad_cardiaca: data.enfermedadCardiaca,
            hipertension: data.hipertension,
            diabetes: data.diabetes,
            asma_epoc: data.asmaCopd,
            cancer_tratamiento: data.cancer,
            embarazo: data.embarazo,
            semanas_embarazo: data.semanasEmbarazo,
            otras_enfermedades: data.otrasEnfermedades,
            // Sección 4
            toma_medicacion: data.tomaMedicacion,
            lista_medicacion: data.listaMedicacion,
            anticoagulantes: data.anticoagulantes,
            bisfosfonatos: data.bisfosfonatos,
            antibioticos_actuales: data.antibioticosActuales,
            // Sección 5
            alergia_penicilina: data.alergiaPenicilina,
            alergia_aspirina: data.alergiaAspirina,
            alergia_ibuprofeno: data.alergiaIbuprofeno,
            alergia_anestesia_local: data.alergiaAnestesia,
            alergia_latex: data.alergiaLatex,
            alergia_metal: data.alergiaMetal,
            otras_alergias: data.otrasAlergias,
            // Sección 6
            fumador: data.fumador,
            alcohol: data.alcohol,
            bruxismo_conocido: data.bruxismo,
            higiene_oral: data.higieneOral,
            usa_hilo_dental: data.usaHiloDental,
            usa_enjuague: data.usaEnjuague,
            // Sección 7
            extracciones_previas: data.extracciones,
            endodoncias_previas: data.endodoncias,
            implantes_previos: data.implantes,
            ortodoncia_previa: data.ortodoncia,
            protesis: data.protesis,
            miedos_dentista: data.miedosDentista,
            // Sección 8
            acepta_politica_privacidad: data.aceptaPoliticaPrivacidad,
            acepta_tratamiento_datos: data.aceptaTratamientoDatos,
        };

        await dbUpdate('primera_visita_questionnaire', record.id, updatePayload as any);

        logAudit({
            action: 'SIGN_DOCUMENT',
            entity_type: 'questionnaire',
            entity_id: record.id,
            details: {
                numPac: record.num_pac,
                token: token.substring(0, 8) + '...',
                // ⚠️ Flags críticos para seguridad clínica
                alertas_clinicas: [
                    data.anticoagulantes ? '⚠️ ANTICOAGULANTES' : null,
                    data.bisfosfonatos ? '⚠️ BISFOSFONATOS' : null,
                    data.embarazo ? '⚠️ EMBARAZO' : null,
                    data.alergiaPenicilina ? '⚠️ ALERGIA PENICILINA' : null,
                    data.alergiaAnestesia ? '⚠️ ALERGIA ANESTESIA' : null,
                ].filter(Boolean),
            },
        });

        logger.info('[Questionnaire] Cuestionario completado para paciente:', record.num_pac);
        return true;
    } catch (e) {
        logger.error('[Questionnaire] guardarRespuestasQuestionnaire error:', e);
        return false;
    }
};

/**
 * Devuelve el cuestionario completado de un paciente (por NumPac).
 * También acepta búsqueda por contacto_id para primera visita pendiente de conversión.
 */
export const getQuestionnairePorPaciente = async (
    numPac: string,
    contactoId?: string,
): Promise<QuestionnaireRecord | null> => {
    if (!isDbConfigured()) return null;
    try {
        // Buscar primero por NumPac, luego por contactoId como fallback
        const filter: Record<string, string> = { estado: 'eq.completado', order: 'completado_at.desc', limit: '1' };
        if (numPac) filter.num_pac = `eq.${numPac}`;
        else if (contactoId) filter.contacto_id = `eq.${contactoId}`;
        else return null;

        const rows = await dbSelect<QuestionnaireRecord>('primera_visita_questionnaire', filter);
        return rows[0] ?? null;
    } catch (e) {
        logger.error('[Questionnaire] getQuestionnairePorPaciente error:', e);
        return null;
    }
};

/**
 * Mensaje WhatsApp con el enlace al cuestionario.
 * Listo para usar como plantilla en la automatización first-visit-questionnaire.
 */
export const generarMensajeQuestionnaire = (nombrePaciente: string, url: string, fechaCita: string): string =>
    `📋 ¡Bienvenido/a a Rubio García Dental, ${nombrePaciente}!

Antes de tu primera visita el ${fechaCita}, necesitamos que completes un breve cuestionario de salud (3-5 minutos):

👉 ${url}

⏰ El enlace es válido hasta 1h tras tu cita.

Si tienes dudas, llámanos al 📞 [TELÉFONO_CLÍNICA].

¡Hasta pronto! 😊`;
