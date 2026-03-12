-- ─────────────────────────────────────────────────────────────────
-- SPRINT 9: Tabla contactos
-- Personas que han pedido primera visita pero aún NO son pacientes.
-- No tienen NumPac ni IdPac (se generan en GELITE al acudir).
--
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    apellidos TEXT,
    telefono TEXT NOT NULL,
    email TEXT,
    origen TEXT NOT NULL DEFAULT 'primera_visita' CHECK (
        origen IN (
            'primera_visita',
            'whatsapp',
            'manual',
            'derivacion'
        )
    ),
    estado TEXT NOT NULL DEFAULT 'potencial' CHECK (
        estado IN (
            'potencial',
            'confirmado',
            'convertido',
            'cancelado',
            'no_acudio'
        )
    ),
    -- Relleno AL CONVERTIR en paciente (acción manual del personal)
    num_pac TEXT,
    -- NumPac de GELITE
    id_pac TEXT,
    -- IdPac de GELITE (si aplica)
    -- Datos de la cita/contacto inicial
    fecha_cita_prevista TIMESTAMPTZ,
    doctor_asignado TEXT,
    motivo_consulta_inicial TEXT,
    -- Notas internas
    notas TEXT,
    -- Auditoría
    created_by TEXT,
    -- usuario SmilePro que tomó nota
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ── Índices ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contactos_telefono ON contactos(telefono);
CREATE INDEX IF NOT EXISTS idx_contactos_estado ON contactos(estado);
CREATE INDEX IF NOT EXISTS idx_contactos_num_pac ON contactos(num_pac)
WHERE num_pac IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contactos_fecha ON contactos(fecha_cita_prevista);
-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
-- Solo usuarios autenticados pueden leer / crear / actualizar contactos
CREATE POLICY "authenticated_crud_contactos" ON contactos FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ── Trigger updated_at ────────────────────────────────────────────
CREATE TRIGGER trg_contactos_updated_at BEFORE
UPDATE ON contactos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ── Actualización de questionnaire para admitir contacto_id ──────
-- Permitir que questionnaire funcione con contactos (sin NumPac aún)
ALTER TABLE primera_visita_questionnaire
ADD COLUMN IF NOT EXISTS contacto_id UUID REFERENCES contactos(id),
    ALTER COLUMN num_pac DROP NOT NULL;
-- Al menos uno de los dos debe estar presente
ALTER TABLE primera_visita_questionnaire DROP CONSTRAINT IF EXISTS questionnaire_requires_id;
ALTER TABLE primera_visita_questionnaire
ADD CONSTRAINT questionnaire_requires_id CHECK (
        num_pac IS NOT NULL
        OR contacto_id IS NOT NULL
    );
-- ── Actualización de citas_web para admitir contacto_id ──────────
ALTER TABLE citas_web
ADD COLUMN IF NOT EXISTS contacto_id UUID REFERENCES contactos(id);
-- ── Vista de verificación ─────────────────────────────────────────
-- SELECT id, nombre, telefono, estado, num_pac, fecha_cita_prevista
-- FROM contactos
-- ORDER BY created_at DESC
-- LIMIT 20;