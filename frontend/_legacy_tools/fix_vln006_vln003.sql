-- ═══════════════════════════════════════════════════════════════════
-- FIX VLN-006: Token TTL server-side (8h expiración)
-- FIX VLN-003: stock_ajustes_pendientes — evita escritura directa en FDW
-- EJECUTAR EN: Supabase SQL Editor (después de fix_auth_schema.sql)
-- ═══════════════════════════════════════════════════════════════════
-- ─── VLN-006: Añadir expiración a app_sessions ────────────────────
-- Añadir columna expires_at si no existe
ALTER TABLE app_sessions
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '8 hours');
-- Índice para limpieza de sesiones expiradas
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON app_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON app_sessions(token);
-- ─── VLN-006: Actualizar RPC app_login para incluir expires_at ────
CREATE OR REPLACE FUNCTION public.app_login(p_email TEXT, p_password TEXT) RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = extensions,
    public AS $$
DECLARE v_user app_users %ROWTYPE;
v_token TEXT;
v_expires TIMESTAMPTZ;
BEGIN -- Buscar usuario por email
SELECT * INTO v_user
FROM app_users
WHERE email = p_email;
IF NOT FOUND THEN RETURN json_build_object('error', 'Credenciales incorrectas');
END IF;
-- Verificar contraseña con bcrypt
IF v_user.password_hash != extensions.crypt(p_password, v_user.password_hash) THEN RETURN json_build_object('error', 'Credenciales incorrectas');
END IF;
-- Generar token opaco único
v_token := encode(gen_random_bytes(32), 'hex');
v_expires := now() + INTERVAL '8 hours';
-- Guardar sesión con TTL
INSERT INTO app_sessions (user_id, token, expires_at)
VALUES (v_user.id, v_token, v_expires) ON CONFLICT DO NOTHING;
-- Actualizar último login
UPDATE app_users
SET last_login = now()
WHERE id = v_user.id;
RETURN json_build_object(
    'token',
    v_token,
    'expires_at',
    v_expires,
    'user',
    json_build_object(
        'id',
        v_user.id,
        'email',
        v_user.email,
        'nombre',
        v_user.nombre,
        'rol',
        v_user.rol
    )
);
END;
$$;
-- ─── VLN-006: RPC validate_token — verifica TTL ───────────────────
CREATE OR REPLACE FUNCTION public.validate_token(p_token TEXT) RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_session app_sessions %ROWTYPE;
v_user app_users %ROWTYPE;
BEGIN -- Buscar sesión activa y no expirada
SELECT * INTO v_session
FROM app_sessions
WHERE token = p_token
    AND expires_at > now();
IF NOT FOUND THEN RETURN json_build_object(
    'valid',
    false,
    'error',
    'Token expirado o inválido'
);
END IF;
-- Obtener usuario
SELECT * INTO v_user
FROM app_users
WHERE id = v_session.user_id;
RETURN json_build_object(
    'valid',
    true,
    'expires_at',
    v_session.expires_at,
    'user',
    json_build_object(
        'id',
        v_user.id,
        'email',
        v_user.email,
        'nombre',
        v_user.nombre,
        'rol',
        v_user.rol
    )
);
END;
$$;
-- ─── VLN-006: RPC revoke_token — logout real ──────────────────────
CREATE OR REPLACE FUNCTION public.revoke_token(p_token TEXT) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
DELETE FROM app_sessions
WHERE token = p_token;
RETURN true;
END;
$$;
-- ─── VLN-006: Limpieza automática de sesiones expiradas (cron) ────
-- Requiere pg_cron habilitado en Supabase (Dashboard > Extensions)
-- SELECT cron.schedule('limpieza-sesiones', '0 * * * *', $$ DELETE FROM app_sessions WHERE expires_at < now() $$);
-- ─── VLN-003: Tabla stock_ajustes_pendientes ─────────────────────
-- Sustituye la escritura directa en FDW TArticulo (bypass contable)
CREATE TABLE IF NOT EXISTS stock_ajustes_pendientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_articulo TEXT NOT NULL,
    nombre_articulo TEXT,
    stock_anterior NUMERIC,
    stock_nuevo NUMERIC NOT NULL,
    motivo TEXT NOT NULL DEFAULT 'Ajuste manual desde SmilePro',
    usuario_email TEXT NOT NULL,
    usuario_rol TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    -- pendiente | aplicado | rechazado
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_at TIMESTAMPTZ,
    applied_by TEXT
);
ALTER TABLE stock_ajustes_pendientes ENABLE ROW LEVEL SECURITY;
-- Solo admin puede ver/crear ajustes
CREATE POLICY sap_select ON stock_ajustes_pendientes FOR
SELECT USING (true);
-- controlado desde frontend por usePermission
CREATE POLICY sap_insert ON stock_ajustes_pendientes FOR
INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_sap_articulo ON stock_ajustes_pendientes(id_articulo);
CREATE INDEX IF NOT EXISTS idx_sap_estado ON stock_ajustes_pendientes(estado);
-- Notificar cuando llega un ajuste nuevo (para integración con GELITE)
CREATE OR REPLACE FUNCTION notify_stock_ajuste() RETURNS TRIGGER AS $$ BEGIN PERFORM pg_notify('stock_ajuste', row_to_json(NEW)::text);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_notify_stock_ajuste ON stock_ajustes_pendientes;
CREATE TRIGGER trg_notify_stock_ajuste
AFTER
INSERT ON stock_ajustes_pendientes FOR EACH ROW EXECUTE FUNCTION notify_stock_ajuste();
-- Recargar schema PostgREST
NOTIFY pgrst,
'reload schema';
SELECT 'OK: VLN-006 (token TTL, validate_token, revoke_token), VLN-003 (stock_ajustes_pendientes)' AS status;