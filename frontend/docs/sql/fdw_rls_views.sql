-- ─────────────────────────────────────────────────────────────────
-- AUDITORÍA - Fix 5: RLS para Foreign Tables de GELITE (FDW)
-- AUDITORÍA A01/OWASP — Broken Access Control
--
-- PROBLEMA: Las Foreign Tables (DCitas, TtosMed, Pacientes, etc.) no
-- soportan RLS de Supabase. Con el anon key cualquiera puede leer TODOS
-- los datos. Esta migración crea VIEWs seguras con auth checks y revoca
-- el acceso directo a las tablas FDW.
--
-- EJECUTAR EN SUPABASE SQL EDITOR:
--   https://supabase.com/dashboard/project/ogrbukdqkwvzuilltudp/sql/new
--
-- IMPORTANTE: Ejecutar DESPUÉS de verificar que la app funciona con las VIEWs.
-- ─────────────────────────────────────────────────────────────────
-- ── 1. Función helper: verificar que el usuario tiene sesión activa ──
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS BOOLEAN AS $$ BEGIN -- Verifica que hay un token válido en la tabla de sesiones activas
    -- AJUSTAR: si el sistema custom guarda tokens en otra tabla, cambiar aquí
    RETURN EXISTS (
        SELECT 1
        FROM user_tokens
        WHERE token = current_setting('request.headers', true)::json->>'authorization'
            AND expires_at > NOW()
    );
EXCEPTION
WHEN OTHERS THEN -- Si no existe la tabla user_tokens o hay error, denegar por defecto
RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ── 2. VIEWs seguras sobre las Foreign Tables ───────────────────────
-- Vista segura de Pacientes (solo usuarios autenticados)
CREATE OR REPLACE VIEW v_pacientes AS
SELECT *
FROM "Pacientes"
WHERE is_authenticated();
-- Vista segura de Citas
CREATE OR REPLACE VIEW v_citas AS
SELECT *
FROM "DCitas"
WHERE is_authenticated();
-- Vista segura de Historia Clínica
CREATE OR REPLACE VIEW v_tratamientos_medicos AS
SELECT *
FROM "TtosMed"
WHERE is_authenticated();
-- Vista segura de Facturas
CREATE OR REPLACE VIEW v_facturas AS
SELECT *
FROM "NV_CabFactura"
WHERE is_authenticated();
-- Vista segura de Artículos/Inventario
CREATE OR REPLACE VIEW v_articulos AS
SELECT *
FROM "TArticulo"
WHERE is_authenticated();
-- Vista segura de Colaboradores
CREATE OR REPLACE VIEW v_colaboradores AS
SELECT *
FROM "TColabos"
WHERE is_authenticated();
-- ── 3. RLS en las VIEWs (solo authenticated) ────────────────────────
-- Dar acceso a las VIEWs solo al rol authenticated (no anon)
GRANT SELECT ON v_pacientes TO authenticated;
GRANT SELECT ON v_citas TO authenticated;
GRANT SELECT ON v_tratamientos_medicos TO authenticated;
GRANT SELECT ON v_facturas TO authenticated;
GRANT SELECT ON v_articulos TO authenticated;
GRANT SELECT ON v_colaboradores TO authenticated;
-- ── 4. Revocar acceso DIRECTO a las Foreign Tables ──────────────────
-- ⚠️ HACER ESTO ÚLTIMO — Verificar app funciona con VIEWs primero
-- REVOCAR acceso al rol anon (peticiones sin autenticación)
REVOKE
SELECT ON "DCitas"
FROM anon;
REVOKE
SELECT ON "TtosMed"
FROM anon;
REVOKE
SELECT ON "Pacientes"
FROM anon;
REVOKE
SELECT ON "NV_CabFactura"
FROM anon;
REVOKE
SELECT ON "TArticulo"
FROM anon;
REVOKE
SELECT ON "TColabos"
FROM anon;
REVOKE
SELECT ON "BancoMov"
FROM anon;
REVOKE
SELECT ON "PRESUTTO"
FROM anon;
REVOKE
SELECT ON "StckMov"
FROM anon;
-- REVOCAR acceso al rol authenticated para forzar uso de VIEWs
-- (comentar si necesitas acceso directo para algún RPC con SECURITY DEFINER)
-- REVOKE SELECT ON "DCitas"    FROM authenticated;
-- REVOKE SELECT ON "TtosMed"   FROM authenticated;
-- REVOKE SELECT ON "Pacientes" FROM authenticated;
-- ── 5. Verificación ─────────────────────────────────────────────────
-- Verificar que las VIEWs están creadas:
-- SELECT table_name FROM information_schema.views WHERE table_schema = 'public';
-- Verificar acceso con anon key (debe devolver 0 filas o error):
-- SELECT * FROM "DCitas" LIMIT 1; -- Como anon → debe fallar
-- SELECT * FROM v_citas LIMIT 1;  -- Como authenticated → debe funcionar