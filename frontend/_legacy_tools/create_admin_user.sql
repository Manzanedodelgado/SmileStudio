-- ─────────────────────────────────────────────────────────────────
-- create_admin_user.sql
-- Crear usuario administrador en Supabase Auth.
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL → New Query).
--
-- ⚠️  CAMBIAR la contraseña antes de ejecutar en producción.
-- ─────────────────────────────────────────────────────────────────
-- Opción 1: Crear vía función de Supabase Auth
-- (Requiere extensión auth — disponible por defecto en Supabase)
INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'info@rubiogarciadental.com',
        crypt('190582', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
        '{"name": "Juan Antonio Manzanedo", "clinic_role": "admin"}'::jsonb,
        now(),
        now()
    );
-- Verificar que se creó correctamente:
SELECT id,
    email,
    raw_user_meta_data->>'name' AS name,
    raw_app_meta_data->>'role' AS app_role
FROM auth.users
WHERE email = 'info@rubiogarciadental.com';