-- ─────────────────────────────────────────────────────────────────
-- SPRINT 11: Extensión del cuestionario para LOPD y consentimientos
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE primera_visita_questionnaire -- LOPD
ADD COLUMN IF NOT EXISTS acepta_lopd BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lopd_fecha TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lopd_ip TEXT,
    ADD COLUMN IF NOT EXISTS lopd_user_agent TEXT,
    ADD COLUMN IF NOT EXISTS lopd_version TEXT DEFAULT '2025-v1',
    -- Versión del texto legal firmado
    -- Consentimiento de tratamiento adicional
ADD COLUMN IF NOT EXISTS tratamiento_solicitado TEXT,
    -- Nombre del tratamiento adicional
ADD COLUMN IF NOT EXISTS acepta_consentimiento_tto BOOLEAN,
    -- NULL = no aplica, FALSE/TRUE = firmado
ADD COLUMN IF NOT EXISTS consentimiento_tto_fecha TIMESTAMPTZ,
    -- Firma del tutor (para menores)
ADD COLUMN IF NOT EXISTS firmado_por_tutor BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS nombre_firmante TEXT,
    -- Nombre de quien firmó (puede ser tutor)
    -- Hash del documento para integridad
ADD COLUMN IF NOT EXISTS version_doc_hash TEXT,
    -- SHA-256 del contenido que firmó
    -- Fecha de creación del NumPac
ADD COLUMN IF NOT EXISTS numpac_asignado_at TIMESTAMPTZ;
-- ── Índices adicionales ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questionnaire_lopd ON primera_visita_questionnaire(acepta_lopd)
WHERE acepta_lopd = TRUE;
CREATE INDEX IF NOT EXISTS idx_questionnaire_tto ON primera_visita_questionnaire(tratamiento_solicitado)
WHERE tratamiento_solicitado IS NOT NULL;