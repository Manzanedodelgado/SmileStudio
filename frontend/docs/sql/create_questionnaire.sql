-- ─────────────────────────────────────────────────────────────────
-- SPRINT 6: Cuestionario de Primera Visita (Anamnesis Digital)
--
-- Guarda las respuestas del cuestionario de salud previo a la
-- primera visita del paciente.
--
-- EJECUTAR EN SUPABASE SQL EDITOR:
--   https://supabase.com/dashboard/project/ogrbukdqkwvzuilltudp/sql/new
-- ─────────────────────────────────────────────────────────────────
-- ── 1. Tabla principal del cuestionario ─────────────────────────────
CREATE TABLE IF NOT EXISTS primera_visita_questionnaire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    num_pac TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    -- Token URL-safe de un solo uso generado al crear la cita
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (
        estado IN ('pendiente', 'completado', 'expirado')
    ),
    expires_at TIMESTAMPTZ NOT NULL,
    -- Token expira 1h después de la primera visita
    -- ── SECCIÓN 1: Datos Generales ────────────────────────────────
    fecha_nacimiento DATE,
    sexo TEXT CHECK (
        sexo IN (
            'Masculino',
            'Femenino',
            'Otro',
            'Prefiero no indicar'
        )
    ),
    profesion TEXT,
    medico_cabecera TEXT,
    num_historia_medica TEXT,
    -- ── SECCIÓN 2: Motivo de Consulta ────────────────────────────
    motivo_consulta TEXT,
    ultima_visita_dentista TEXT,
    -- Ej: "< 6 meses", "6-12 meses", "1-2 años", "> 2 años", "Nunca"
    frecuencia_visitas TEXT,
    -- ── SECCIÓN 3: Estado de Salud General ───────────────────────
    enfermedad_cardiaca BOOLEAN DEFAULT FALSE,
    hipertension BOOLEAN DEFAULT FALSE,
    diabetes TEXT CHECK (
        diabetes IN ('No', 'Tipo 1', 'Tipo 2', 'Prediabetes')
    ),
    asma_epoc BOOLEAN DEFAULT FALSE,
    enfermedades_renales BOOLEAN DEFAULT FALSE,
    enfermedades_hepaticas BOOLEAN DEFAULT FALSE,
    artritis_reumatoide BOOLEAN DEFAULT FALSE,
    cancer_tratamiento BOOLEAN DEFAULT FALSE,
    embarazo BOOLEAN DEFAULT FALSE,
    semanas_embarazo INTEGER,
    otras_enfermedades TEXT,
    -- ── SECCIÓN 4: Medicación Actual ─────────────────────────────
    toma_medicacion BOOLEAN DEFAULT FALSE,
    lista_medicacion TEXT,
    -- Lista libre de medicamentos
    anticoagulantes BOOLEAN DEFAULT FALSE,
    bisfosfonatos BOOLEAN DEFAULT FALSE,
    -- ⚠️ Crítico para implantes/cirugía
    antibioticos_actuales BOOLEAN DEFAULT FALSE,
    -- ── SECCIÓN 5: Alergias ───────────────────────────────────────
    alergia_penicilina BOOLEAN DEFAULT FALSE,
    alergia_aspirina BOOLEAN DEFAULT FALSE,
    alergia_ibuprofeno BOOLEAN DEFAULT FALSE,
    alergia_anestesia_local BOOLEAN DEFAULT FALSE,
    alergia_latex BOOLEAN DEFAULT FALSE,
    alergia_metal BOOLEAN DEFAULT FALSE,
    otras_alergias TEXT,
    -- ── SECCIÓN 6: Hábitos ────────────────────────────────────────
    fumador TEXT CHECK (
        fumador IN ('No', 'Ocasional', 'Diario', 'Ex-fumador')
    ),
    alcohol TEXT CHECK (alcohol IN ('No', 'Ocasional', 'Frecuente')),
    bruxismo_conocido BOOLEAN DEFAULT FALSE,
    higiene_oral TEXT CHECK (
        higiene_oral IN ('1 vez/día', '2 veces/día', '3 veces/día')
    ),
    usa_hilo_dental BOOLEAN DEFAULT FALSE,
    usa_enjuague BOOLEAN DEFAULT FALSE,
    -- ── SECCIÓN 7: Historial Dental ──────────────────────────────
    extracciones_previas BOOLEAN DEFAULT FALSE,
    endodoncias_previas BOOLEAN DEFAULT FALSE,
    implantes_previos BOOLEAN DEFAULT FALSE,
    ortodoncia_previa BOOLEAN DEFAULT FALSE,
    protesis TEXT CHECK (
        protesis IN (
            'No',
            'Parcial removible',
            'Total removible',
            'Fija'
        )
    ),
    miedos_dentista TEXT,
    -- Campo libre
    experiencias_negativas TEXT,
    -- ── SECCIÓN 8: Consentimiento ─────────────────────────────────
    acepta_politica_privacidad BOOLEAN NOT NULL DEFAULT FALSE,
    acepta_tratamiento_datos BOOLEAN NOT NULL DEFAULT FALSE,
    firma_digital TEXT,
    -- Base64 o hash de confirmación
    -- ── Metadatos ─────────────────────────────────────────────────
    ip_paciente TEXT,
    user_agent TEXT,
    completado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ── 2. Índices ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questionnaire_num_pac ON primera_visita_questionnaire(num_pac);
CREATE INDEX IF NOT EXISTS idx_questionnaire_token ON primera_visita_questionnaire(token);
CREATE INDEX IF NOT EXISTS idx_questionnaire_estado ON primera_visita_questionnaire(estado);
-- ── 3. RLS ─────────────────────────────────────────────────────────
ALTER TABLE primera_visita_questionnaire ENABLE ROW LEVEL SECURITY;
-- El token anon puede insertar/actualizar su propio cuestionario (paciente rellena desde enlace)
CREATE POLICY "anon_fill_questionnaire" ON primera_visita_questionnaire FOR ALL TO anon USING (
    estado = 'pendiente'
    AND expires_at > NOW()
) WITH CHECK (true);
-- Profesionales autenticados pueden leer todos
CREATE POLICY "authenticated_read_questionnaire" ON primera_visita_questionnaire FOR
SELECT TO authenticated USING (true);
-- ── 4. Trigger updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_questionnaire_updated_at BEFORE
UPDATE ON primera_visita_questionnaire FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ── 5. Verificación ────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'primera_visita_questionnaire';