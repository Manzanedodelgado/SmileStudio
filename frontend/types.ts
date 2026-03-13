// ─── SmileStudio — Tipos de Agenda / Citas ──────────────────────
//  Usados por citas.service.ts y componentes de agenda.
// ─────────────────────────────────────────────────────────────────

export type EstadoCita =
    | 'planificada'
    | 'confirmada'
    | 'en_sala'
    | 'en_consulta'
    | 'finalizada'
    | 'anulada'
    | 'cancelada';

export type TratamientoCategoria =
    | 'Diagnostico'
    | 'Urgencia'
    | 'Protesis'
    | 'Cirugía'
    | 'Ortodoncia'
    | 'Periodoncia'
    | 'Implante'
    | 'Higiene'
    | 'Endodoncia'
    | 'Conservadora';

export interface Cita {
    id: string;
    pacienteNumPac: string;
    nombrePaciente: string;
    gabinete: string;
    horaInicio: string;        // 'HH:MM'
    duracionMinutos: number;
    tratamiento: string;
    categoria: TratamientoCategoria;
    estado: EstadoCita;
    doctor: string;
    alertasMedicas: string[];
    alertasLegales: string[];
    alertasFinancieras: boolean;
    notas: string;
    movil?: string;           // teléfono móvil para WhatsApp
    apellidos?: string;       // Apellidos separados
    nombre?: string;          // Nombre separado
    fecha?: string;           // 'YYYY-MM-DD' para filtrar por día
}

export interface SOAPNote {
    id: string;
    fecha: string;
    doctor: string;
    especialidad: string;
    tratamiento_nombre?: string;
    tratamiento_id?: number;
    subjetivo: string;
    objetivo: string;
    analisis: string;
    plan: string;
    pieza?: number;
    firmada: boolean;
    eva: number;
    timestamp: string;
    alertasDetectadas: string[];
}
