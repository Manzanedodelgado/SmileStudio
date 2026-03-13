-- ─────────────────────────────────────────────────────────────────
-- create_config_agenda_web.sql
-- Tabla para persistir la configuración de la agenda (doctores,
-- horarios, tratamientos) como JSONB. Un registro por clínica.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.config_agenda_web (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id text NOT NULL DEFAULT 'default',
    -- Configuración serializada como JSONB
    doctores jsonb NOT NULL DEFAULT '[]'::jsonb,
    horarios jsonb NOT NULL DEFAULT '[]'::jsonb,
    tratamientos jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Auditoría
    updated_at timestamptz DEFAULT now(),
    updated_by text
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_agenda_clinic ON public.config_agenda_web (clinic_id);
ALTER TABLE public.config_agenda_web ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_config" ON public.config_agenda_web FOR ALL USING (true) WITH CHECK (true);
CREATE OR REPLACE FUNCTION update_config_agenda_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_config_agenda_updated BEFORE
UPDATE ON public.config_agenda_web FOR EACH ROW EXECUTE FUNCTION update_config_agenda_timestamp();
SELECT 'config_agenda_web creada' AS resultado;