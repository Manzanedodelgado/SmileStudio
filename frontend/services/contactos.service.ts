// ─────────────────────────────────────────────────────────────────
//  services/contactos.service.ts
//  SPRINT 9: Gestión del ciclo vida Contacto → Paciente/Cliente.
//
//  Un contacto es una persona que ha pedido una primera visita
//  pero NO tiene aún NumPac ni IdPac en GELITE.
//
//  Al acudir a la cita, el personal:
//  1. Crea el expediente en GELITE → obtiene NumPac + IdPac
//  2. En SmilePro llama a convertirEnPaciente(id, numPac, idPac)
//
//  Tabla: contactos  (ver docs/sql/create_contactos.sql)
// ─────────────────────────────────────────────────────────────────

import { dbInsert, dbUpdate, dbSelect, dbDelete, isDbConfigured, generateId } from './db';
import { logAudit } from './audit.service';
import { logger } from './logger';
import { crearQuestionnaireToken } from './questionnaire.service';

// ── Tipos ──────────────────────────────────────────────────────────

export type ContactoEstado = 'potencial' | 'confirmado' | 'convertido' | 'cancelado' | 'no_acudio';
export type ContactoOrigen = 'primera_visita' | 'whatsapp' | 'manual' | 'derivacion';
export type ContactoCanal = 'recepcion' | 'whatsapp' | 'web' | 'telefono';

export interface Contacto {
    id: string;
    nombre: string;
    apellidos?: string;
    telefono: string;
    email?: string;
    origen: ContactoOrigen;
    estado: ContactoEstado;
    canalEntrada: ContactoCanal;
    numPac?: string;         // SP-NNNN (propio) o NumPac GELITE tras conversión
    idPac?: string;
    fechaCitaPrevista?: string;
    doctorAsignado?: string;
    motivoConsultaInicial?: string;
    tratamientoAdicional?: string;
    notas?: string;
    // Menor de edad
    esMenor: boolean;
    fechaNacimientoPac?: string;
    nombreTutor?: string;
    apellidosTutor?: string;
    telefonoTutor?: string;  // WhatsApp del tutor si es menor
    emailTutor?: string;
    relacionTutor?: string;  // 'padre' | 'madre' | 'tutor_legal' | 'otro'
    // Flags de estado documental
    numpacAsignado: boolean;
    lopdAceptada: boolean;
    lopdFecha?: string;
    formularioCompletado: boolean;
    formularioCompletadoAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface ContactoRow {
    id: string;
    nombre: string;
    apellidos?: string;
    telefono: string;
    email?: string;
    origen: string;
    estado: string;
    canal_entrada: string;
    num_pac?: string;
    id_pac?: string;
    fecha_cita_prevista?: string;
    doctor_asignado?: string;
    motivo_consulta_inicial?: string;
    tratamiento_adicional?: string;
    notas?: string;
    es_menor: boolean;
    fecha_nacimiento_pac?: string;
    nombre_tutor?: string;
    apellidos_tutor?: string;
    telefono_tutor?: string;
    email_tutor?: string;
    relacion_tutor?: string;
    numpac_asignado: boolean;
    lopd_aceptada: boolean;
    lopd_fecha?: string;
    formulario_completado: boolean;
    formulario_completado_at?: string;
    created_at: string;
    updated_at: string;
}

const rowToContacto = (r: ContactoRow): Contacto => ({
    id: r.id,
    nombre: r.nombre,
    apellidos: r.apellidos,
    telefono: r.telefono,
    email: r.email,
    origen: r.origen as ContactoOrigen,
    estado: r.estado as ContactoEstado,
    canalEntrada: (r.canal_entrada ?? 'recepcion') as ContactoCanal,
    numPac: r.num_pac,
    idPac: r.id_pac,
    fechaCitaPrevista: r.fecha_cita_prevista,
    doctorAsignado: r.doctor_asignado,
    motivoConsultaInicial: r.motivo_consulta_inicial,
    tratamientoAdicional: r.tratamiento_adicional,
    notas: r.notas,
    esMenor: r.es_menor ?? false,
    fechaNacimientoPac: r.fecha_nacimiento_pac,
    nombreTutor: r.nombre_tutor,
    apellidosTutor: r.apellidos_tutor,
    telefonoTutor: r.telefono_tutor,
    emailTutor: r.email_tutor,
    relacionTutor: r.relacion_tutor,
    numpacAsignado: r.numpac_asignado ?? false,
    lopdAceptada: r.lopd_aceptada ?? false,
    lopdFecha: r.lopd_fecha,
    formularioCompletado: r.formulario_completado ?? false,
    formularioCompletadoAt: r.formulario_completado_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
});

// ── Validación ─────────────────────────────────────────────────────

export interface ContactoValidationError { field: string; message: string; }

export const validateContacto = (c: Partial<Contacto>): ContactoValidationError[] => {
    const errs: ContactoValidationError[] = [];
    if (!c.nombre?.trim() || c.nombre.trim().length < 2)
        errs.push({ field: 'nombre', message: 'El nombre es obligatorio (mínimo 2 caracteres)' });
    if (!c.telefono?.trim())
        errs.push({ field: 'telefono', message: 'El teléfono es obligatorio' });
    else if (!/^\+?[0-9\s\-()]{7,20}$/.test(c.telefono))
        errs.push({ field: 'telefono', message: 'Formato de teléfono inválido' });
    if (c.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))
        errs.push({ field: 'email', message: 'Formato de email inválido' });
    // Validar tutor si es menor
    if (c.esMenor) {
        if (!c.nombreTutor?.trim())
            errs.push({ field: 'nombreTutor', message: 'El nombre del tutor es obligatorio para menores' });
        if (!c.telefonoTutor?.trim())
            errs.push({ field: 'telefonoTutor', message: 'El teléfono del tutor es obligatorio para menores' });
        else if (!/^\+?[0-9\s\-()]{7,20}$/.test(c.telefonoTutor))
            errs.push({ field: 'telefonoTutor', message: 'Formato de teléfono del tutor inválido' });
    }
    return errs;
};

// ── In-memory fallback (modo demo / BD no configurada) ─────────────

const _demoStore: Contacto[] = [];

// ── API Pública ────────────────────────────────────────────────────

/**
 * Crea un nuevo contacto para una primera visita.
 * Soporta menores de edad (datos del tutor) y canal de entrada.
 */
export const crearContacto = async (
    datos: {
        nombre: string; apellidos?: string; telefono: string; email?: string;
        origen?: ContactoOrigen; canalEntrada?: ContactoCanal; fechaCita?: Date;
        doctorAsignado?: string; motivoConsultaInicial?: string; notas?: string;
        tratamientoAdicional?: string;
        esMenor?: boolean; fechaNacimientoPac?: string;
        nombreTutor?: string; apellidosTutor?: string;
        telefonoTutor?: string; emailTutor?: string; relacionTutor?: string;
    },
): Promise<{ contacto: Contacto; linkCuestionario: string | null }> => {
    const forValidation = { ...datos, esMenor: datos.esMenor ?? false, canalEntrada: datos.canalEntrada ?? 'recepcion' as ContactoCanal, numpacAsignado: false, lopdAceptada: false, formularioCompletado: false };
    const errors = validateContacto(forValidation);
    if (errors.length > 0) throw new Error(`Datos inválidos: ${errors.map(e => e.message).join(', ')}`);

    let contacto: Contacto;
    const rowData = {
        nombre: datos.nombre.trim().replace(/\s{2,}/g, ' '),
        apellidos: datos.apellidos?.trim().replace(/\s{2,}/g, ' '),
        telefono: datos.telefono.trim(),
        email: datos.email?.trim().toLowerCase(),
        origen: datos.origen ?? 'primera_visita',
        canal_entrada: datos.canalEntrada ?? 'recepcion',
        estado: 'potencial',
        es_menor: datos.esMenor ?? false,
        fecha_nacimiento_pac: datos.fechaNacimientoPac,
        nombre_tutor: datos.nombreTutor?.trim(),
        apellidos_tutor: datos.apellidosTutor?.trim(),
        telefono_tutor: datos.telefonoTutor?.trim(),
        email_tutor: datos.emailTutor?.trim().toLowerCase(),
        relacion_tutor: datos.relacionTutor,
        tratamiento_adicional: datos.tratamientoAdicional,
        fecha_cita_prevista: datos.fechaCita?.toISOString(),
        doctor_asignado: datos.doctorAsignado,
        motivo_consulta_inicial: datos.motivoConsultaInicial,
        notas: datos.notas,
    };

    if (!isDbConfigured()) {
        const demo: Contacto = {
            id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            nombre: rowData.nombre, apellidos: rowData.apellidos, telefono: rowData.telefono,
            email: rowData.email, origen: rowData.origen as ContactoOrigen, estado: 'potencial',
            canalEntrada: (rowData.canal_entrada ?? 'recepcion') as ContactoCanal,
            esMenor: rowData.es_menor, nombreTutor: rowData.nombre_tutor,
            apellidosTutor: rowData.apellidos_tutor, telefonoTutor: rowData.telefono_tutor,
            emailTutor: rowData.email_tutor, relacionTutor: rowData.relacion_tutor,
            tratamientoAdicional: rowData.tratamiento_adicional,
            numpacAsignado: false, lopdAceptada: false, formularioCompletado: false,
        };
        _demoStore.push(demo);
        logger.warn('[Contactos] BD no configurada:', demo.id);
        contacto = demo;
    } else {
        try {
            const row = await dbInsert<ContactoRow>('contactos', rowData as any);
            if (!row) throw new Error('No se pudo crear el contacto');
            contacto = rowToContacto(row);
        } catch (e) { logger.error('[Contactos] crearContacto error:', e); throw e; }
    }

    logAudit({
        action: 'GENERATE_DOCUMENT', entity_type: 'contacto', entity_id: contacto.id,
        details: { nombre: contacto.nombre, esMenor: contacto.esMenor, canal: contacto.canalEntrada }
    });

    let linkCuestionario: string | null = null;
    if (datos.fechaCita && isDbConfigured()) {
        linkCuestionario = await crearQuestionnaireToken(contacto.id, datos.fechaCita, 'contacto');
    }
    return { contacto, linkCuestionario };
};

/**
 * Lista todos los contactos activos (potencial + confirmado).
 */
export const getContactosActivos = async (): Promise<Contacto[]> => {
    if (!isDbConfigured()) return _demoStore.filter(c => c.estado !== 'convertido');
    try {
        const rows = await dbSelect<ContactoRow>('contactos', {
            estado: 'in.(potencial,confirmado)',
            order: 'fecha_cita_prevista.asc',
        });
        return rows.map(rowToContacto);
    } catch (e) {
        logger.error('[Contactos] getContactosActivos error:', e);
        return [];
    }
};

/**
 * Obtiene un contacto por ID.
 */
export const getContactoPorId = async (id: string): Promise<Contacto | null> => {
    if (!isDbConfigured()) return _demoStore.find(c => c.id === id) ?? null;
    try {
        const rows = await dbSelect<ContactoRow>('contactos', { id: `eq.${id}` });
        return rows[0] ? rowToContacto(rows[0]) : null;
    } catch (e) {
        logger.error('[Contactos] getContactoPorId error:', e);
        return null;
    }
};

/**
 * Busca contactos por nombre o teléfono.
 */
export const buscarContactos = async (query: string): Promise<Contacto[]> => {
    if (!isDbConfigured()) {
        const q = query.toLowerCase();
        return _demoStore.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            c.apellidos?.toLowerCase().includes(q) ||
            c.telefono.includes(q),
        );
    }
    try {
        const rows = await dbSelect<ContactoRow>('contactos', {
            or: `nombre.ilike.*${query}*,apellidos.ilike.*${query}*,telefono.ilike.*${query}*`,
            order: 'created_at.desc',
            limit: '20',
        });
        return rows.map(rowToContacto);
    } catch (e) {
        logger.error('[Contactos] buscarContactos error:', e);
        return [];
    }
};

/**
 * Actualiza el estado de un contacto (ej: potencial → confirmado).
 */
export const actualizarEstadoContacto = async (
    id: string,
    estado: ContactoEstado,
    notas?: string,
): Promise<boolean> => {
    if (!isDbConfigured()) {
        const c = _demoStore.find(x => x.id === id);
        if (c) { c.estado = estado; if (notas) c.notas = notas; }
        return !!c;
    }
    try {
        const update: Partial<ContactoRow> = { estado };
        if (notas) update.notas = notas;
        await dbUpdate('contactos', id, update as any);
        return true;
    } catch (e) {
        logger.error('[Contactos] actualizarEstadoContacto error:', e);
        return false;
    }
};

/**
 * ACCIÓN PRINCIPAL: Convierte un contacto en paciente/cliente.
 * Se llama tras crear el expediente en GELITE y obtener NumPac + IdPac.
 *
 * @param contactoId - ID del contacto en Supabase
 * @param numPac     - NumPac asignado por GELITE
 * @param idPac      - IdPac asignado por GELITE (opcional)
 */
export const convertirContactoEnPaciente = async (
    contactoId: string,
    numPac: string,
    idPac?: string,
): Promise<boolean> => {
    if (!numPac.trim()) {
        throw new Error('NumPac es obligatorio para convertir el contacto en paciente');
    }

    if (!isDbConfigured()) {
        const c = _demoStore.find(x => x.id === contactoId);
        if (c) { c.estado = 'convertido'; c.numPac = numPac; c.idPac = idPac; }
        return !!c;
    }

    try {
        await dbUpdate('contactos', contactoId, {
            estado: 'convertido',
            num_pac: numPac.trim(),
            id_pac: idPac?.trim(),
        } as any);

        logAudit({
            action: 'VIEW_DOCUMENT',  // Reusing closest audit action — conversion event
            entity_type: 'contacto',
            entity_id: contactoId,
            details: { accion: 'CONVERTIR_EN_PACIENTE', numPac, idPac },
        });

        logger.info(`[Contactos] Contacto ${contactoId} convertido en paciente ${numPac}`);
        return true;
    } catch (e) {
        logger.error('[Contactos] convertirContactoEnPaciente error:', e);
        return false;
    }
};

/**
 * Genera el mensaje WhatsApp de bienvenida para un contacto.
 * Si es menor, el destinatario es el tutor.
 */
export const generarMensajeBienvenidaContacto = (
    contacto: Pick<Contacto, 'nombre' | 'apellidos' | 'esMenor' | 'nombreTutor' | 'apellidosTutor'>,
    fechaCita: string,
    linkCuestionario?: string,
    telefonoClinica = '[TELÉFONO_CLÍNICA]',
): string => {
    const nombrePaciente = [contacto.nombre, contacto.apellidos].filter(Boolean).join(' ');
    const destinatario = contacto.esMenor && contacto.nombreTutor
        ? [contacto.nombreTutor, contacto.apellidosTutor].filter(Boolean).join(' ')
        : nombrePaciente;

    const cuestionarioBloque = linkCuestionario
        ? `\n\n📋 ${contacto.esMenor ? 'Como tutor/a, necesitamos que completes' : 'Antes de tu visita, completa'} el cuestionario de salud (3 min):\n👉 ${linkCuestionario}\n⏰ El enlace expira 1h tras la cita.`
        : '';

    const menorBloque = contacto.esMenor
        ? `\n\nEsta cita es para el/la menor ${nombrePaciente}. Como tutor/a legal, tu firma será necesaria en los documentos.`
        : '';

    return `👋 Hola ${destinatario}, te escribimos de Rubio García Dental.

Tienes cita el ${fechaCita}.${menorBloque}${cuestionarioBloque}

Si necesitas cancelar o cambiar la cita, llámanos al 📞 ${telefonoClinica}.

¡Hasta pronto! 😊`;
};

/**
 * Asigna NumPac SP-NNNN al contacto llamando a la función SQL.
 * Si ya tiene uno, devuelve el existente.
 */
export const asignarNumPac = async (contactoId: string): Promise<string | null> => {
    if (!isDbConfigured()) {
        const c = _demoStore.find(x => x.id === contactoId);
        if (!c) return null;
        if (!c.numPac) { c.numPac = `SP-DEMO-${contactoId.substring(0, 4).toUpperCase()}`; c.numpacAsignado = true; }
        return c.numPac ?? null;
    }
    try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const res = await fetch(`${url}/rest/v1/rpc/asignar_numpac`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
            body: JSON.stringify({ p_contacto_id: contactoId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json() as string;
        logger.info('[Contactos] NumPac asignado:', result, 'contacto:', contactoId);
        return result;
    } catch (e) { logger.error('[Contactos] asignarNumPac error:', e); return null; }
};

/**
 * Vincula el NumPac GELITE al registro SP-NNNN.
 * El NumPac GELITE sustituye al SP-NNNN como identificador principal.
 */
export const vincularNumPacGelite = async (contactoId: string, geliteNumPac: string): Promise<boolean> => {
    if (!isDbConfigured()) return false;
    try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const res = await fetch(`${url}/rest/v1/rpc/vincular_numpac_gelite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
            body: JSON.stringify({ p_contacto_id: contactoId, p_gelite_num_pac: geliteNumPac }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
    } catch (e) { logger.error('[Contactos] vincularNumPacGelite error:', e); return false; }
};

/**
 * Actualiza el contacto con datos del formulario completado por el paciente.
 * Regla: los datos del formulario SIEMPRE prevalecen sobre los de recepción.
 */
export const autocompletarDesdeFormulario = async (
    contactoId: string,
    datosFormulario: { nombre?: string; apellidos?: string; telefono?: string; email?: string; fechaNacimientoPac?: string },
): Promise<boolean> => {
    if (!isDbConfigured()) {
        const c = _demoStore.find(x => x.id === contactoId);
        if (!c) return false;
        if (datosFormulario.nombre) c.nombre = datosFormulario.nombre;
        if (datosFormulario.apellidos) c.apellidos = datosFormulario.apellidos;
        if (datosFormulario.telefono) c.telefono = datosFormulario.telefono;
        if (datosFormulario.email) c.email = datosFormulario.email;
        c.formularioCompletado = true;
        c.formularioCompletadoAt = new Date().toISOString();
        return true;
    }
    try {
        const update: Partial<ContactoRow> = {
            formulario_completado: true,
            formulario_completado_at: new Date().toISOString(),
        };
        if (datosFormulario.nombre) update.nombre = datosFormulario.nombre.trim();
        if (datosFormulario.apellidos) update.apellidos = datosFormulario.apellidos.trim();
        if (datosFormulario.telefono) update.telefono = datosFormulario.telefono.trim();
        if (datosFormulario.email) update.email = datosFormulario.email.trim().toLowerCase();
        if (datosFormulario.fechaNacimientoPac) update.fecha_nacimiento_pac = datosFormulario.fechaNacimientoPac;
        await dbUpdate('contactos', contactoId, update as any);
        logger.info('[Contactos] Datos autocompletados desde formulario:', contactoId);
        return true;
    } catch (e) { logger.error('[Contactos] autocompletarDesdeFormulario error:', e); return false; }
};
