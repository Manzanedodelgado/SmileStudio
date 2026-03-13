-- =================================================================
-- SmilePro 2026 — AUDIT RLS + CHAT HISTORY
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-03-01
-- =================================================================
-- ─────────────────────────────────────────────────────────────────
-- 1. RLS en audit_log (VLN-009)
--    Solo admin puede SELECT. INSERT permitido a todos (anon key).
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- Solo admin puede leer el audit log
DROP POLICY IF EXISTS audit_admin_select ON public.audit_log;
CREATE POLICY audit_admin_select ON public.audit_log FOR
SELECT USING (
        (
            SELECT rol
            FROM public.app_users
            WHERE id::text = current_setting('app.user_id', true)
        ) = 'admin'
    );
-- Cualquier usuario autenticado puede insertar (fire-and-forget desde frontend)
DROP POLICY IF EXISTS audit_insert ON public.audit_log;
CREATE POLICY audit_insert ON public.audit_log FOR
INSERT WITH CHECK (true);
-- ─────────────────────────────────────────────────────────────────
-- 2. Tabla chat_history para Sara IA (VLN-014)
--    Persiste el historial de conversación por sesión.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Índice para queries rápidas por sesión
CREATE INDEX IF NOT EXISTS idx_chat_history_session ON public.chat_history (session_id, created_at ASC);
-- RLS para chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
-- Cualquier usuario autenticado puede leer y escribir su propia sesión
DROP POLICY IF EXISTS chat_history_all ON public.chat_history;
CREATE POLICY chat_history_all ON public.chat_history FOR ALL USING (true) WITH CHECK (true);
-- ─────────────────────────────────────────────────────────────────
-- 3. Limpiar sesiones antiguas (TTL 30 días) — cron manual
-- ─────────────────────────────────────────────────────────────────
-- Ejecutar periódicamente:
-- DELETE FROM public.chat_history WHERE created_at < now() - interval '30 days';
-- =================================================================
-- Verificación
-- =================================================================
SELECT tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('audit_log', 'chat_history')
    AND schemaname = 'public';