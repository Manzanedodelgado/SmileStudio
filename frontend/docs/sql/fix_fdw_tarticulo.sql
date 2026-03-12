-- ═══════════════════════════════════════════════════════════════════════════════
--  fix_fdw_tarticulo.sql
--  R1 FIX: Corrige la definición de las Foreign Tables TArticulo y StckMov
--  cuyas columnas están desincronizadas con SQL Server GELITE.
--
--  PROBLEMA CONFIRMADO (2026-03-04):
--    SELECT * FROM TArticulo → Error 500: "Invalid column name 'Nombre'"
--    SELECT * FROM StckMov  → Error 500: "Invalid column name 'IdMov'"
--    Solo responden: TArticulo.IdArticulo, TArticulo.Codigo
--
--  INSTRUCCIONES:
--    1. Ir a: https://supabase.com/dashboard/project/ltfstsjfybpbtiakopor/sql/new
--    2. PRIMERO: Ejecutar paso 0 para descubrir los nombres reales de columnas
--    3. Ajustar los nombres en el paso 1 según lo que devuelva GELITE
--    4. Ejecutar pasos 1 y 2
--    5. Verificar con las queries del paso 3
-- ═══════════════════════════════════════════════════════════════════════════════
-- ── PASO 0: DIAGNÓSTICO — Descubrir nombres reales en SQL Server ─────────────
-- Ejecutar PRIMERO en SSMS (SQL Server Management Studio) contra DESPACHO\INFOMED:
--
--   SELECT COLUMN_NAME, DATA_TYPE
--   FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_NAME = 'TArticulo' AND TABLE_SCHEMA = 'dbo'
--   ORDER BY ORDINAL_POSITION;
--
--   SELECT COLUMN_NAME, DATA_TYPE
--   FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_NAME = 'StckMov' AND TABLE_SCHEMA = 'dbo'
--   ORDER BY ORDINAL_POSITION;
--
-- Columnas confirmadas como existentes el 2026-03-04:
--   TArticulo: IdArticulo ✅, Codigo ✅
--   TArticulo: Nombre ❌, SKU ❌, StockFisico ❌, IdFamilia ❌, Activo ❌, PrecioCompra ❌
--
-- Una vez que tengas los nombres reales de SSMS, sustituye los valores
-- comentados con "← AJUSTAR" por los nombres correctos.
-- ── PASO 1: Redefinir TArticulo con columnas confirmadas ─────────────────────
DROP FOREIGN TABLE IF EXISTS public."TArticulo";
CREATE FOREIGN TABLE public."TArticulo" (
    "IdArticulo" text,
    -- PK confirmada ✅
    "Codigo" text,
    -- SKU/código confirmado ✅
    -- Añadir las siguientes líneas CUANDO se confirmen los nombres reales en SSMS:
    -- "Nombre"        text,         -- ← AJUSTAR con nombre real de la columna de descripción
    -- "StockFisico"   text,         -- ← AJUSTAR con nombre real del campo de stock
    -- "PrecioCompra"  text,         -- ← AJUSTAR con nombre real del campo de precio
    -- "IdFamilia"     text,         -- ← AJUSTAR (puede ser "Familia", "CodFamilia", etc.)
    -- "Activo"        text,         -- ← AJUSTAR (puede ser "Baja", "Activo", "Estado", etc.)
    "Guid_Tenant" text -- Identificador de tenant (si existe)
) SERVER mssql_wrapper_server OPTIONS (table 'dbo.TArticulo');
GRANT SELECT ON public."TArticulo" TO service_role;
GRANT SELECT ON public."TArticulo" TO authenticated;
COMMENT ON FOREIGN TABLE public."TArticulo" IS 'Artículos/Inventario GELITE — R1 FIX: solo columnas confirmadas. Ver fix_fdw_tarticulo.sql para añadir más.';
-- ── PASO 2: Redefinir StckMov con columnas confirmadas ───────────────────────
DROP FOREIGN TABLE IF EXISTS public."StckMov";
CREATE FOREIGN TABLE public."StckMov" (
    -- Columnas mínimas que muy probablemente existen en dbo.StckMov de GELITE:
    -- (ajustar tras ejecutar INFORMATION_SCHEMA en SSMS)
    "IdMov" text,
    -- ← AJUSTAR si el nombre real es distinto
    "IdArticulo" text,
    -- FK TArticulo ← confirmar nombre
    "Lote" text,
    -- Número de lote fabricante
    "FecCaducidad" text,
    -- Fecha de caducidad del lote
    "Cantidad" text,
    -- Unidades en este lote
    "FecMov" text,
    -- Fecha del movimiento
    "TipoMov" text,
    -- Entrada / Salida / Ajuste
    "Guid_Tenant" text
) SERVER mssql_wrapper_server OPTIONS (table 'dbo.StckMov');
GRANT SELECT ON public."StckMov" TO service_role;
GRANT SELECT ON public."StckMov" TO authenticated;
COMMENT ON FOREIGN TABLE public."StckMov" IS 'Movimientos de stock GELITE — R1 FIX: columnas ajustadas. Ver fix_fdw_tarticulo.sql.';
-- ── PASO 3: Recargar schema de PostgREST ─────────────────────────────────────
NOTIFY pgrst,
'reload schema';
-- ── PASO 4: VERIFICACIÓN ─────────────────────────────────────────────────────
-- Ejecutar una por una en Supabase SQL Editor:
-- 4a. Verificar TArticulo (debe devolver filas sin error):
-- SELECT "IdArticulo", "Codigo" FROM public."TArticulo" LIMIT 5;
-- Si devuelve error → el nombre de la tabla en SQL Server es diferente de 'dbo.TArticulo'
-- Ejecutar en SSMS: SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='dbo' ORDER BY TABLE_NAME
-- 4b. Verificar StckMov (debe devolver filas sin error):
-- SELECT "IdArticulo", "Lote", "FecCaducidad", "Cantidad" FROM public."StckMov" LIMIT 5;
-- 4c. Verificar desde PostgREST (sustituir la key):
-- curl -s "https://ltfstsjfybpbtiakopor.supabase.co/rest/v1/TArticulo?select=IdArticulo,Codigo&limit=5&order=IdArticulo.asc" \
--   -H "apikey: TU_SERVICE_ROLE_KEY" -H "Authorization: Bearer TU_SERVICE_ROLE_KEY"