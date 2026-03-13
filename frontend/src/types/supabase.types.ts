// ─── SmileStudio — Tipos Supabase (tablas nuevas, NO en GELITE) ─────────
//  Estas interfaces corresponden a tablas que deben crearse en Supabase
//  porque NO existen en la BD GELITE heredada.
// ────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
//  IA & AUTOMATIZACIÓN
// ═══════════════════════════════════════════════════════════════

/** Configuración del agente IA Dental */
export interface IAConfig {
    id: string;
    nombre_agente: string;          // "IA Dental"
    idioma: string;                 // "Español neutro"
    mensaje_bienvenida: string;
    tono: 'calida' | 'profesional' | 'cercana' | 'eficiente';
    empatia: number;                // 0-100
    proactividad: number;           // 0-100
    formalidad: number;             // 0-100
    created_at: string;
    updated_at: string;
}

/** Ítems de la base de conocimiento del agente */
export interface IAKnowledge {
    id: string;
    ia_config_id: string;
    contenido: string;              // "Horario: Lunes a Viernes 8:30-20:00..."
    orden: number;
    created_at: string;
}

/** Reglas de escalado del agente IA */
export interface IAEscalationRule {
    id: string;
    ia_config_id: string;
    condicion: string;              // "dolor severo / sangrado"
    accion: string;                 // "Escalar a recepción inmediatamente"
    severidad: 'critica' | 'alta' | 'media' | 'baja';
    activa: boolean;
    orden: number;
    created_at: string;
}

/** Regla de automatización (ej: Recordatorio 24h) */
export interface Automatizacion {
    id: string;
    nombre: string;                 // "Recordatorio 24h antes"
    descripcion: string;
    trigger_evento: string;         // 'cita_creada' | 'cita_24h_antes' | 'post_visita' | 'respuesta_recibida'
    canal: 'whatsapp' | 'email' | 'sms';
    plantilla_id?: string;
    activa: boolean;
    total_envios: number;
    tasa_exito: number;             // 0-100 (ej: 94)
    created_at: string;
    updated_at: string;
}

/** Log de envío de una automatización */
export interface AutomatizacionLog {
    id: string;
    automatizacion_id: string;
    paciente_numpac: string;
    canal: 'whatsapp' | 'email' | 'sms';
    estado: 'enviado' | 'entregado' | 'leido' | 'fallido';
    fecha_envio: string;
    fecha_respuesta?: string;
    respuesta?: string;
}

/** Mensaje del historial de chat IA */
export interface ChatMessage {
    id: string;
    session_id: string;
    rol: 'user' | 'assistant' | 'system';
    contenido: string;
    timestamp: string;
    tokens_usados?: number;
}

/** Flujo conversacional multi-paso */
export interface Flujo {
    id: string;
    nombre: string;                 // "Seguimiento Post-Visita"
    descripcion: string;
    pasos: FlujoPaso[];
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface FlujoPaso {
    id: string;
    flujo_id: string;
    orden: number;
    tipo: 'mensaje' | 'espera' | 'condicion' | 'accion';
    contenido: string;
    delay_horas?: number;           // para tipo 'espera'
    condicion?: string;             // para tipo 'condicion'
}

/** Plantilla de mensaje (WhatsApp, Email, SMS) */
export interface Plantilla {
    id: string;
    nombre: string;
    canal: 'whatsapp' | 'email' | 'sms';
    asunto?: string;                // solo email
    cuerpo: string;                 // con {{variables}}
    variables: string[];            // ['nombre', 'fecha_cita', 'doctor']
    activa: boolean;
    created_at: string;
    updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
//  PACIENTES — Extensiones
// ═══════════════════════════════════════════════════════════════

/** Documento clínico (consentimiento, cuestionario) */
export interface DocumentoClinico {
    id: string;
    paciente_numpac: string;
    tipo: 'consentimiento' | 'cuestionario' | 'informe' | 'receta';
    titulo: string;
    contenido_url: string;          // URL en Supabase Storage
    firmado: boolean;
    fecha_firma?: string;
    ip_firma?: string;
    created_at: string;
}

/** Firma electrónica con bloqueo legal 24h */
export interface FirmaElectronica {
    id: string;
    documento_id: string;
    paciente_numpac: string;
    doctor_idcol: number;
    hash_documento: string;
    fecha_firma: string;
    bloqueado_hasta: string;        // fecha_firma + 24h
    ip: string;
    user_agent: string;
}

/** Alerta de seguridad de paciente */
export interface AlertaPaciente {
    id: string;
    paciente_numpac: string;
    tipo: 'alergia' | 'medicacion' | 'condicion' | 'legal' | 'financiera';
    mensaje: string;                // "Alergia al látex activa"
    severidad: 'critica' | 'alta' | 'info';
    activa: boolean;
    created_at: string;
    updated_at: string;
}

/** Metadata de foto intraoral/extraoral */
export interface FotoPaciente {
    id: string;
    paciente_numpac: string;
    tipo: 'frente' | 'derecha' | 'izquierda' | 'oclusal_sup' | 'oclusal_inf' | 'intraoral';
    url: string;                    // Supabase Storage
    thumbnail_url: string;
    fecha: string;
    created_at: string;
}

/** Metadata de estudio RX */
export interface RxPaciente {
    id: string;
    paciente_numpac: string;
    tipo: 'panoramica' | 'periapical' | 'cbct' | 'cefalometria';
    url: string;                    // Supabase Storage
    thumbnail_url: string;
    fecha: string;
    notas?: string;
    created_at: string;
}

// ═══════════════════════════════════════════════════════════════
//  INVENTARIO — Extensiones
// ═══════════════════════════════════════════════════════════════

/** Pre-pedido generado por IA */
export interface SmartOrder {
    id: string;
    estado: 'borrador' | 'propuesto' | 'aprobado' | 'enviado';
    lineas: SmartOrderLinea[];
    total_estimado: number;
    generado_por: 'ia' | 'manual';
    created_at: string;
    aprobado_por?: string;
    aprobado_at?: string;
}

export interface SmartOrderLinea {
    id: string;
    smart_order_id: string;
    articulo_id: number;            // FK → TArticulo.IdArticulo
    nombre: string;
    stock_actual: number;
    stock_minimo: number;
    cantidad_propuesta: number;
    precio_unitario: number;
    proveedor?: string;
}

/** Registro de escaneo QR de trazabilidad */
export interface TrazabilidadQR {
    id: string;
    lote: string;
    articulo_id: number;            // FK → TArticulo.IdArticulo
    tipo_evento: 'entrada' | 'salida' | 'uso' | 'caducidad';
    fecha_evento: string;
    escaneado_por: string;          // usuario
    paciente_numpac?: string;       // si se usó en paciente
    notas?: string;
    created_at: string;
}

// ═══════════════════════════════════════════════════════════════
//  RADIOLOGÍA — DICOM
// ═══════════════════════════════════════════════════════════════

/** Metadata de estudio DICOM */
export interface DicomStudy {
    id: string;
    paciente_numpac: string;
    modalidad: 'RX' | 'CBCT' | 'CT' | 'OPG';
    fecha_estudio: string;
    kvp?: number;
    doctor_idcol: number;
    institucion: string;
    archivo_url: string;            // Supabase Storage
    series_count: number;
    slices_count: number;
    dimensiones: string;            // "128x128x64"
    created_at: string;
}

/** Ajustes de visualización guardados para un estudio */
export interface DicomAdjustment {
    id: string;
    dicom_study_id: string;
    brillo: number;                 // 0-100
    contraste: number;              // 0-100
    nitidez: number;                // 0-100
    lut: 'grises' | 'hueso' | 'termico' | 'dental_suave' | 'dental_calido' | 'arcoiris' | 'viridis' | 'frio';
    window_center: number;          // C:1300
    window_width: number;           // W:1500
    ia_mejorado: boolean;
    updated_at: string;
}
