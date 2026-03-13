-- ─────────────────────────────────────────────────────────────────
-- create_agenda_lookup_fdws.sql
-- Foreign Tables para lookup de la Agenda.
-- Server: mssql_wrapper_server
-- Nota: Foreign tables NO soportan RLS — acceso controlado por apikey.
-- ─────────────────────────────────────────────────────────────────
-- 1. IconoTratAgenda — Tipos de tratamiento
CREATE FOREIGN TABLE IF NOT EXISTS public."IconoTratAgenda" (
    "IdIcono" integer,
    "Descripcion" text,
    "ImagenTxt" text
) SERVER mssql_wrapper_server OPTIONS (table 'dbo.IconoTratAgenda');
-- 2. TSitCita — Estados de cita
CREATE FOREIGN TABLE IF NOT EXISTS public."TSitCita" (
    "IdSitC" integer,
    "Descripcio" text,
    "Color" integer,
    "FlgAnulada" text,
    "FlgVisible" text,
    "Orden" integer
) SERVER mssql_wrapper_server OPTIONS (table 'dbo.TSitCita');
-- 3. TUsuAgd — Asignaciones doctor↔agenda
CREATE FOREIGN TABLE IF NOT EXISTS public."TUsuAgd" (
    "IdUsu" integer,
    "IdCol" integer,
    "Nombre" text,
    "Color" integer,
    "Visible" text
) SERVER mssql_wrapper_server OPTIONS (table 'dbo.TUsuAgd');
-- ── Verificación ──────────────────────────────────────────────────
SELECT 'IconoTratAgenda' AS tabla,
    count(*) AS registros
FROM "IconoTratAgenda"
UNION ALL
SELECT 'TSitCita',
    count(*)
FROM "TSitCita"
UNION ALL
SELECT 'TUsuAgd',
    count(*)
FROM "TUsuAgd";