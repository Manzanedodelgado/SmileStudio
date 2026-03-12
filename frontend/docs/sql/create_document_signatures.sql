-- ─────────────────────────────────────────────────────────────────
-- AUDITORÍA - Sprint 3: Consentimientos & Documentos Reales
-- AUDITORÍA-VULN-003 + RGPD Art. 9 FIX
--
-- Crea la tabla document_signatures para persistir consentimientos
-- y documentos firmados con validez legal.
--
-- EJECUTAR EN SUPABASE SQL EDITOR:
--   https://supabase.com/dashboard/project/ogrbukdqkwvzuilltudp/sql/new
-- ─────────────────────────────────────────────────────────────────
-- ── 1. Tabla de documentos pendientes por paciente ──────────────────
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    num_pac TEXT NOT NULL,
    -- ID del paciente (NumPac visible)
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (
        tipo IN (
            'RGPD',
            'Consentimiento',
            'Presupuesto',
            'Instrucciones',
            'Recomendaciones',
            'Primera_Visita'
        )
    ),
    template_id TEXT NOT NULL,
    -- ID de la plantilla usada
    estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (
        estado IN ('Pendiente', 'Firmado', 'Caducado', 'Revocado')
    ),
    contenido_hash TEXT,
    -- SHA-256 del contenido del documento (integridad)
    created_by TEXT NOT NULL,
    -- email del profesional que lo generó
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ── 2. Tabla de firmas (append-only, no se puede borrar) ────────────
CREATE TABLE IF NOT EXISTS document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES patient_documents(id) ON DELETE RESTRICT,
    num_pac TEXT NOT NULL,
    firmante_nombre TEXT NOT NULL,
    -- Nombre del firmante (paciente o tutor)
    firmante_tipo TEXT NOT NULL CHECK (
        firmante_tipo IN ('paciente', 'tutor_legal', 'profesional')
    ),
    metodo_firma TEXT NOT NULL CHECK (
        metodo_firma IN (
            'biometrico',
            'checkbox_aceptacion',
            'firma_digital'
        )
    ),
    ip_firmante TEXT,
    -- IP capturada en el momento de la firma
    user_agent TEXT,
    -- Navegador/dispositivo del firmante
    consentimiento_leido BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp_firma TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    profesional_id TEXT,
    -- ID del profesional que gestionó la firma
    profesional_email TEXT,
    hash_firma TEXT,
    -- Hash SHA-256 de (document_id + firmante + timestamp) para integridad
    -- No se pueden borrar firmas (append-only para validez legal)
    CONSTRAINT no_duplicate_signature UNIQUE (document_id, firmante_nombre, timestamp_firma)
);
-- ── 3. Índices ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patient_documents_num_pac ON patient_documents(num_pac);
CREATE INDEX IF NOT EXISTS idx_patient_documents_estado ON patient_documents(estado);
CREATE INDEX IF NOT EXISTS idx_document_signatures_doc_id ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_num_pac ON document_signatures(num_pac);
-- ── 4. RLS — Solo usuarios autenticados pueden acceder ──────────────
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
-- Profesionales autenticados pueden ver/crear documentos
CREATE POLICY "authenticated_manage_documents" ON patient_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Firmas: solo lectura para authenticated, inserción permitida, borrado prohibido
CREATE POLICY "authenticated_read_signatures" ON document_signatures FOR
SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_signatures" ON document_signatures FOR
INSERT TO authenticated WITH CHECK (true);
-- ⚠️ No UPDATE/DELETE policy → preservación legal de firmas
-- REVOKE UPDATE, DELETE ON document_signatures FROM authenticated;
-- Trigger: actualizar updated_at en patient_documents automáticamente
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_patient_documents_updated_at BEFORE
UPDATE ON patient_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ── 5. Verificación ─────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('patient_documents','document_signatures');