-- ─────────────────────────────────────────────────────────────────
-- create_odontograma_web.sql
-- Tabla nativa Supabase para persistir el odontograma del paciente.
-- Almacena todo el estado como JSONB (32 dientes × 5 caras).
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odontograma_web (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    num_pac text NOT NULL,
    -- NumPac del paciente
    -- Estado completo del odontograma serializado como JSONB
    -- Array de {numero, caras: {vestibular/lingual/mesial/distal/oclusal}, ausente, implante}
    datos jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Auditoría
    updated_at timestamptz DEFAULT now(),
    updated_by text
);
-- Un odontograma por paciente
CREATE UNIQUE INDEX IF NOT EXISTS idx_odontograma_pac ON public.odontograma_web (num_pac);
-- RLS
ALTER TABLE public.odontograma_web ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_odontograma" ON public.odontograma_web FOR ALL USING (true) WITH CHECK (true);
-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_odontograma_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_odontograma_updated BEFORE
UPDATE ON public.odontograma_web FOR EACH ROW EXECUTE FUNCTION update_odontograma_timestamp();
SELECT 'odontograma_web creada' AS resultado;