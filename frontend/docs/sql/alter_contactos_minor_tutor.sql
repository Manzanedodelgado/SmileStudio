-- ─────────────────────────────────────────────────────────────────
-- SPRINT 11: Añadir campos de menor/tutor a contactos
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ─────────────────────────────────────────────────────────────────
-- Datos del paciente menor
ALTER TABLE contactos
ADD COLUMN IF NOT EXISTS es_menor BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fecha_nacimiento_pac DATE,
    -- Datos del tutor/representante legal (solo si es_menor = TRUE)
ADD COLUMN IF NOT EXISTS nombre_tutor TEXT,
    ADD COLUMN IF NOT EXISTS apellidos_tutor TEXT,
    ADD COLUMN IF NOT EXISTS telefono_tutor TEXT,
    -- WhatsApp del tutor
ADD COLUMN IF NOT EXISTS email_tutor TEXT,
    ADD COLUMN IF NOT EXISTS relacion_tutor TEXT,
    -- 'padre' | 'madre' | 'tutor_legal' | 'otro'
    -- Tratamiento adicional solicitado en primera visita
ADD COLUMN IF NOT EXISTS tratamiento_adicional TEXT,
    -- si pide tratamiento en primera cita
    -- Flags de estado documental
ADD COLUMN IF NOT EXISTS numpac_asignado BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lopd_aceptada BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lopd_fecha TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS formulario_completado BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS formulario_completado_at TIMESTAMPTZ,
    -- Origen de la cita (recepción, WhatsApp entrante, web)
ADD COLUMN IF NOT EXISTS canal_entrada TEXT NOT NULL DEFAULT 'recepcion' CHECK (
        canal_entrada IN ('recepcion', 'whatsapp', 'web', 'telefono')
    );
-- Índice para búsqueda por tutor
CREATE INDEX IF NOT EXISTS idx_contactos_tutor_tel ON contactos(telefono_tutor)
WHERE telefono_tutor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contactos_menor ON contactos(es_menor)
WHERE es_menor = TRUE;