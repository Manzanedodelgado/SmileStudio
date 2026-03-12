-- ─────────────────────────────────────────────────────────────────
-- AUDITORÍA - Fix 3: Rate Limiting en login
-- AUDITORÍA-VULN-002 FIX
--
-- Crea la tabla login_attempts y actualiza el RPC app_login
-- para bloquear más de 5 intentos en 15 minutos por IP.
--
-- EJECUTAR EN SUPABASE SQL EDITOR:
--   https://supabase.com/dashboard/project/ogrbukdqkwvzuilltudp/sql/new
-- ─────────────────────────────────────────────────────────────────
-- 1. Tabla de intentos de login
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGSERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    username TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT FALSE
);
-- Índice para limpiar y buscar eficientemente
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username, attempted_at DESC);
-- RLS: solo la app puede insertar (vía app_login RPC con SECURITY DEFINER)
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
-- Nadie puede leer ni escribir directamente (acceso solo vía RPC)
CREATE POLICY "no_direct_access_login_attempts" ON login_attempts FOR ALL TO anon,
authenticated USING (false) WITH CHECK (false);
-- 2. Función de limpieza de intentos viejos (>24h) para evitar crecimiento infinito
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts() RETURNS void AS $$ BEGIN
DELETE FROM login_attempts
WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. Actualizar el RPC app_login existente con rate limiting
--    ⚠️ AJUSTAR según la firma exacta del RPC actual en Supabase
--    Si el RPC actual tiene parámetros distintos, adaptar los nombres.
CREATE OR REPLACE FUNCTION app_login_with_rate_limit(
        p_username TEXT,
        p_password TEXT,
        p_ip TEXT DEFAULT '0.0.0.0'
    ) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_attempt_count INT;
v_result JSON;
BEGIN -- Limpiar intentos viejos (>24h) periodicamente
PERFORM cleanup_old_login_attempts();
-- Verificar rate limit: máx 5 intentos fallidos en 15 minutos por IP
SELECT COUNT(*) INTO v_attempt_count
FROM login_attempts
WHERE ip = p_ip
    AND success = FALSE
    AND attempted_at > NOW() - INTERVAL '15 minutes';
IF v_attempt_count >= 5 THEN -- Registrar intento bloqueado
INSERT INTO login_attempts(ip, username, success)
VALUES (p_ip, p_username, FALSE);
RAISE EXCEPTION 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.' USING ERRCODE = 'P0429';
-- 429 Too Many Requests
END IF;
-- Llamar al login original (adapt según la firma real del RPC app_login)
-- AJUSTAR: reemplazar 'app_login' con la función real si tiene otro nombre
BEGIN
SELECT app_login(p_username, p_password) INTO v_result;
EXCEPTION
WHEN OTHERS THEN -- Login fallido → registrar intento
INSERT INTO login_attempts(ip, username, success)
VALUES (p_ip, p_username, FALSE);
RAISE;
END;
-- Login exitoso → registrar y resetear contador de IP
INSERT INTO login_attempts(ip, username, success)
VALUES (p_ip, p_username, TRUE);
RETURN v_result;
END;
$$;
-- Dar acceso al rol anon (para llamadas del frontend sin auth)
GRANT EXECUTE ON FUNCTION app_login_with_rate_limit(TEXT, TEXT, TEXT) TO anon;
-- 4. OPCIONAL: pg_cron para limpiar la tabla cada hora
-- (requiere activar pg_cron en Supabase Database → Extensions)
-- SELECT cron.schedule('cleanup-login-attempts', '0 * * * *',
--     'SELECT cleanup_old_login_attempts()');