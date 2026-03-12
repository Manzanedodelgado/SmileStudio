-- ─────────────────────────────────────────────────────────────────
-- SPRINT 11: Registro de documentos firmados
--
-- Cada vez que un paciente/contacto firma un documento (cuestionario,
-- LOPD, consentimiento de tratamiento), se registra aquí.
-- Es inmutable: nunca se borra, solo se marca como revocado.
--
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documento_firmado_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Tipo de documento firmado
    tipo_doc TEXT NOT NULL CHECK (
        tipo_doc IN (
            'primera_visita',
            -- Cuestionario anamnesis
            'lopd',
            -- Ley de protección de datos
            'consentimiento',
            -- Consentimiento tratamiento específico
            'revocacion' -- Acto de revocar un documento anterior
        )
    ),
    -- Vinculación al paciente/contacto
    contacto_id UUID REFERENCES contactos(id) ON DELETE
    SET NULL,
        num_pac TEXT,
        -- NumPac del paciente (GELITE o SP-NNNN)
        -- Vinculación a la cita
        cita_id TEXT,
        -- ID de la cita en citas_web o DCitas
        -- Detalles del documento
        tratamiento TEXT,
        -- Para consentimientos: nombre del tratamiento
        version_doc TEXT,
        -- Hash SHA-256 del contenido legal firmado
        texto_doc_hash TEXT,
        -- Resumen del texto que firmó el paciente
        -- Datos de la firma
        firmado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        firmado_por TEXT,
        -- nombre del firmante (puede ser tutor)
        es_tutor_firmante BOOLEAN NOT NULL DEFAULT FALSE,
        ip_firma TEXT,
        user_agent_firma TEXT,
        url_documento TEXT,
        -- Enlace al PDF/documento original en Storage
        -- Revocación
        revocado BOOLEAN NOT NULL DEFAULT FALSE,
        revocado_at TIMESTAMPTZ,
        revocado_motivo TEXT,
        revocado_por TEXT,
        -- Usuario SmilePro que tramitó la revocación
        -- Auditoría interna
        notas TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ── Índices ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dfe_contacto ON documento_firmado_eventos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_dfe_num_pac ON documento_firmado_eventos(num_pac)
WHERE num_pac IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dfe_cita ON documento_firmado_eventos(cita_id)
WHERE cita_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dfe_tipo ON documento_firmado_eventos(tipo_doc);
CREATE INDEX IF NOT EXISTS idx_dfe_revocado ON documento_firmado_eventos(revocado);
-- ── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE documento_firmado_eventos ENABLE ROW LEVEL SECURITY;
-- Solo usuarios autenticados pueden leer y crear (nunca borrar)
CREATE POLICY "auth_read_dfe" ON documento_firmado_eventos FOR
SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_dfe" ON documento_firmado_eventos FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_dfe" ON documento_firmado_eventos FOR
UPDATE TO authenticated USING (true);
-- Nadie puede DELETE (registros inmutables — solo revocación lógica)
-- (sencillamente no hay policy de DELETE)
-- ── Vista: documentos vigentes ─────────────────────────────────────
CREATE OR REPLACE VIEW v_documentos_vigentes AS
SELECT d.id,
    d.tipo_doc,
    d.num_pac,
    d.contacto_id,
    d.cita_id,
    d.tratamiento,
    d.firmado_at,
    d.firmado_por,
    d.es_tutor_firmante,
    d.url_documento,
    c.nombre,
    c.apellidos,
    c.telefono
FROM documento_firmado_eventos d
    LEFT JOIN contactos c ON d.contacto_id = c.id
WHERE d.revocado = FALSE
ORDER BY d.firmado_at DESC;
-- ── Vista para uso público (sin datos sensibles) ───────────────────
-- SELECT id, tipo_doc, firmado_at, revocado FROM documento_firmado_eventos WHERE contacto_id = 'UUID';