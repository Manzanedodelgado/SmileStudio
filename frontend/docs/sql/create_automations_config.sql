-- ─────────────────────────────────────────────────────────────────
--  SQL MIGRACIÓN: automations_config
--  Tabla de persistencia para reglas de automatización.
--  Ejecutar en Supabase SQL Editor — menú Database → SQL Editor
--
--  Generado por: services/automations.service.ts (auto-seed)
--  Fecha: 2026-03-01
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automations_config (
    id TEXT PRIMARY KEY,
    -- ID único de la automatización (slug)
    name TEXT NOT NULL,
    -- Nombre visible
    description TEXT DEFAULT '',
    -- Descripción del comportamiento
    trigger_event TEXT NOT NULL,
    -- Evento que la dispara
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    -- whatsapp | sms | email | multi | interno
    category TEXT NOT NULL DEFAULT 'gestion',
    -- recordatorio | seguimiento | recaptacion | pago | documento | urgencia | clinico | gestion
    active BOOLEAN NOT NULL DEFAULT true,
    executions INTEGER NOT NULL DEFAULT 0,
    success_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    timing TEXT DEFAULT '',
    example TEXT DEFAULT '',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { delayValue, delayUnit, message, channel, schedule, conditions }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índice para filtrar por categoría (frecuente en la UI)
CREATE INDEX IF NOT EXISTS automations_config_category_idx ON automations_config (category);
-- Índice para filtrar activas
CREATE INDEX IF NOT EXISTS automations_config_active_idx ON automations_config (active);
-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_automations_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER automations_config_updated_at BEFORE
UPDATE ON automations_config FOR EACH ROW EXECUTE FUNCTION update_automations_updated_at();
-- Row Level Security (acceso total para la clínica, igual que las demás tablas)
ALTER TABLE automations_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_full_access_automations" ON automations_config FOR ALL USING (true);
-- Permiso para el rol anon (usado por el cliente web)
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON automations_config TO anon;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON automations_config TO authenticated;