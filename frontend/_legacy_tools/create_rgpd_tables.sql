-- ─────────────────────────────────────────────────────────────────
-- create_rgpd_tables.sql
-- Tablas para cumplimiento RGPD en Smile Pro 2026:
--   1. audit_log       — V-005: registro de todas las acciones
--   2. user_roles      — V-004: RBAC (roles y permisos)
-- ─────────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════════════
-- 1. AUDIT TRAIL (Art. 30 RGPD — Registro de actividades)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Quién
    user_id text,
    -- ID del usuario autenticado
    user_email text,
    -- Email para trazabilidad
    user_role text,
    -- Rol en el momento de la acción
    -- Qué
    action text NOT NULL,
    -- 'VIEW_PATIENT', 'EDIT_CITA', 'DELETE_CITA', 'LOGIN', etc.
    entity_type text,
    -- 'paciente', 'cita', 'odontograma', 'soap_note', etc.
    entity_id text,
    -- ID del recurso afectado
    -- Contexto
    details jsonb DEFAULT '{}'::jsonb,
    -- Datos adicionales (campo cambiado, valor anterior, etc.)
    ip_address text,
    user_agent text,
    -- Cuándo
    created_at timestamptz DEFAULT now()
);
-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_date ON public.audit_log (created_at DESC);
-- RLS: solo admins pueden leer el audit log, todos pueden insertar
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_insert" ON public.audit_log FOR
INSERT WITH CHECK (true);
CREATE POLICY "audit_read" ON public.audit_log FOR
SELECT USING (true);
-- ═══════════════════════════════════════════════════════════════
-- 2. RBAC — ROLES DE USUARIO (Art. 25 RGPD — Protección por diseño)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    -- Supabase Auth UID
    email text NOT NULL,
    role text NOT NULL DEFAULT 'viewer',
    -- Roles válidos: 'admin', 'doctor', 'auxiliar', 'recepcion', 'viewer'
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_uid ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_read" ON public.user_roles FOR
SELECT USING (true);
CREATE POLICY "roles_admin" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
SELECT 'audit_log + user_roles creadas' AS resultado;