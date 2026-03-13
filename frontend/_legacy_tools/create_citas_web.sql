-- ─────────────────────────────────────────────────────────────────
-- create_citas_web.sql
-- Tabla nativa Supabase para escritura de citas desde la web.
-- La FDW DCitas es solo lectura (GELITE). Las citas creadas/editadas
-- desde la web se almacenan aquí.
--
-- Ejecutar en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.citas_web (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Referencia a GELITE (si es edición de cita existente)
    id_cita_gelite text,
    -- IdCita original de DCitas (null si es nueva)
    -- Datos de la cita
    num_pac text,
    -- NumPac del paciente
    nombre text,
    -- Nombre completo
    telefono text,
    fecha date NOT NULL,
    hora time NOT NULL,
    duracion_min integer NOT NULL DEFAULT 30,
    id_icono integer,
    -- FK → IconoTratAgenda.IdIcono
    tratamiento text,
    -- Nombre del tratamiento
    id_usu integer,
    -- FK → TUsuAgd.IdUsu (doctor agenda)
    doctor text,
    -- Nombre del doctor
    id_sit_c integer DEFAULT 0,
    -- FK → TSitCita.IdSitC
    estado text DEFAULT 'planificada',
    gabinete text DEFAULT 'G1',
    notas text,
    -- Auditoría
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by text,
    -- user id del que creó
    -- Soft delete
    deleted boolean DEFAULT false
);
-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_citas_web_fecha ON public.citas_web (fecha);
CREATE INDEX IF NOT EXISTS idx_citas_web_num_pac ON public.citas_web (num_pac);
CREATE INDEX IF NOT EXISTS idx_citas_web_doctor ON public.citas_web (id_usu);
CREATE UNIQUE INDEX IF NOT EXISTS idx_citas_web_gelite ON public.citas_web (id_cita_gelite)
WHERE id_cita_gelite IS NOT NULL;
-- RLS abierto (herramienta interna clínica)
ALTER TABLE public.citas_web ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_access_citas_web" ON public.citas_web FOR ALL USING (true) WITH CHECK (true);
-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_citas_web_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_citas_web_updated BEFORE
UPDATE ON public.citas_web FOR EACH ROW EXECUTE FUNCTION update_citas_web_timestamp();
-- Verificar
SELECT 'citas_web creada' AS resultado,
    count(*) AS registros
FROM public.citas_web;