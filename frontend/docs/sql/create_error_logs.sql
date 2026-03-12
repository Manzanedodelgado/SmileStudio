-- ─────────────────────────────────────────────────────────────────
-- AUDITORÍA - Sprint 4: Error Monitoring Table
-- Tabla para el manejador global de errores (setupGlobalErrorHandler)
--
-- EJECUTAR EN SUPABASE SQL EDITOR:
--   https://supabase.com/dashboard/project/ogrbukdqkwvzuilltudp/sql/new
-- ─────────────────────────────────────────────────────────────────
-- ── 1. Tabla de errores de aplicación ──────────────────────────────
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    stack TEXT,
    component_stack TEXT,
    -- Solo errores React (no aplica a window.onerror)
    source TEXT,
    -- Fichero JS donde ocurrió el error
    lineno INTEGER,
    colno INTEGER,
    url TEXT,
    -- URL de la página donde ocurrió el error
    user_agent TEXT,
    -- Navegador/dispositivo del usuario
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ── 2. Índices ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_message ON error_logs USING gin(to_tsvector('simple', message));
-- ── 3. RLS — Solo admins pueden leer. El anon key puede INSERTAR. ───
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
-- La app insertará con el anon key desde window.onerror
CREATE POLICY "anon_insert_error_logs" ON error_logs FOR
INSERT TO anon WITH CHECK (true);
-- Solo usuarios autenticados pueden leer los logs
CREATE POLICY "authenticated_read_error_logs" ON error_logs FOR
SELECT TO authenticated USING (true);
-- Nadie puede borrar ni actualizar errores (append-only)
-- REVOKE UPDATE, DELETE ON error_logs FROM authenticated, anon;
-- ── 4. Limpieza automática (opcional) — borrar errores > 90 días ────
-- Se puede ejecutar como cron job en Supabase Edge Functions
-- CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
-- RETURNS void AS $$
-- BEGIN
--     DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- ── 5. Verificación ─────────────────────────────────────────────────
-- SELECT COUNT(*) FROM error_logs;  -- Debe devolver 0 inicialmente