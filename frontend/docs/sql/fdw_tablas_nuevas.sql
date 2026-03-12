-- ═══════════════════════════════════════════════════════════════════════════════
--  fdw_tablas_nuevas.sql
--  Añade las Foreign Tables que faltan en el FDW MSSQL de GELITE.
--
--  Server: mssql_wrapper_server (bbddsql.servemp3.com / GELITE)
--
--  Tablas YA existentes (NO tocar):
--    Pacientes, DCitas, TtosMed, PRESUTTO, NV_CabFactura, TColabos,
--    TArticulo, StckMov, BancoMov, IconoTratAgenda, TSitCita, TUsuAgd
--
--  Tablas NUEVAS que añade este script:
--    1. NV_LinFactura  → Líneas (conceptos) de cada factura
--    2. FormPago       → Formas de pago disponibles
--    3. NV_CabPresupuesto → Cabecera de presupuesto (si existe separada de PRESUTTO)
--
--  NOTA IMPORTANTE sobre PRESUTTO vs PresuTTo:
--    En GELITE, PRESUTTO (dbo.PresuTTo) contiene las LÍNEAS del presupuesto.
--    No existe tabla separada de cabecera de presupuesto en el esquema actual.
--    Si en tu GELITE existe 'dbo.NV_CabPresupuesto' descomenta esa sección.
--
--  INSTRUCCIONES:
--    1. Ir a: https://supabase.com/dashboard/project/ogrbukdqkwvzuilltudp/sql/new
--    2. Pegar este script completo
--    3. Ejecutar
--    4. Verificar con las queries al final
-- ═══════════════════════════════════════════════════════════════════════════════
-- ─── 1. NV_LinFactura — Líneas / Conceptos de cada Factura ─────────────────
-- Tabla SQL Server: dbo.NV_LinFactura
-- Cada factura (NV_CabFactura) puede tener N líneas.
-- Permite ver el desglose de tratamientos facturados por pieza.
DROP FOREIGN TABLE IF EXISTS public."NV_LinFactura";
CREATE FOREIGN TABLE public."NV_LinFactura" (
    "IdLinea" text,
    -- ID de la línea (PK)
    "IdFactura" text,
    -- FK NV_CabFactura.IdFactura
    "IdPac" text,
    -- FK Pacientes.IdPac
    "Orden" text,
    -- Número de orden en la factura
    "Concepto" text,
    -- Descripción del concepto facturado
    "Diente" text,
    -- Pieza dental (número FDI o texto)
    "Cantidad" text,
    -- Número de unidades
    "PrecioUnitario" text,
    -- Precio unitario
    "Descuento" text,
    -- % de descuento
    "TpcIVA" text,
    -- % de IVA
    "ImporteLinea" text,
    -- Importe total de la línea
    "Guid_Tenant" text
) SERVER mssql_wrapper_server OPTIONS (table 'dbo.NV_LinFactura');
GRANT SELECT ON public."NV_LinFactura" TO service_role;
GRANT SELECT ON public."NV_LinFactura" TO authenticated;
COMMENT ON FOREIGN TABLE public."NV_LinFactura" IS 'Líneas/conceptos de factura GELITE. Permite ver el desglose tratamiento-pieza de cada factura.';
-- ─── 2. FormPago — Formas de Pago disponibles ──────────────────────────────
-- Tabla SQL Server: dbo.FormPago (o TFormasPago según versión GELITE)
-- Catálogo de métodos de pago: Efectivo, Tarjeta, Transferencia, etc.
DROP FOREIGN TABLE IF EXISTS public."FormPago";
CREATE FOREIGN TABLE public."FormPago" (
    "IdFormaPago" text,
    -- ID forma de pago (PK)
    "Descripcion" text,
    -- Efectivo / Tarjeta / Transferencia / Financiado / etc.
    "Activa" text,
    -- 'True'/'False' o '1'/'0'
    "Guid_Tenant" text
) SERVER mssql_wrapper_server OPTIONS (table 'dbo.FormPago');
GRANT SELECT ON public."FormPago" TO service_role;
GRANT SELECT ON public."FormPago" TO authenticated;
COMMENT ON FOREIGN TABLE public."FormPago" IS 'Catálogo de formas de pago de GELITE. Se usa en NV_CabFactura.IdFormaPago y Pacientes.FormPagoHab.';
-- ─── 3. (OPCIONAL) NV_CabPresupuesto — Cabecera de Presupuesto ─────────────
-- Descomenta si en tu GELITE existe esta tabla separada de las líneas.
-- En muchas versiones de GELITE, PRESUTTO (dbo.PresuTTo) contiene las líneas
-- y no hay cabecera separada — en ese caso NO descomentar.
-- DROP FOREIGN TABLE IF EXISTS public."NV_CabPresupuesto";
-- CREATE FOREIGN TABLE public."NV_CabPresupuesto" (
--     "IdPresupuesto"   text,
--     "IdPac"           text,
--     "Fecha"           text,
--     "FechaAceptacion" text,
--     "ImporteTotal"    text,
--     "ImportePagado"   text,
--     "Estado"          text,        -- Pendiente / Aceptado / Rechazado / Finalizado
--     "IdColabo"        text,
--     "Notas"           text,
--     "Guid_Tenant"     text
-- ) SERVER mssql_wrapper_server OPTIONS (table 'dbo.NV_CabPresupuesto');
-- GRANT SELECT ON public."NV_CabPresupuesto" TO service_role;
-- GRANT SELECT ON public."NV_CabPresupuesto" TO authenticated;
-- ─── 4. Notificar a PostgREST que recargue el schema ───────────────────────
NOTIFY pgrst,
'reload schema';
-- ─── 5. VERIFICACIÓN — ejecutar tras la migración ──────────────────────────
-- Una por una para confirmar que el FDW responde:
-- SELECT "IdLinea", "IdFactura", "Concepto", "Diente", "ImporteLinea"
--   FROM public."NV_LinFactura" LIMIT 5;
-- SELECT "IdFormaPago", "Descripcion", "Activa"
--   FROM public."FormPago" LIMIT 10;
-- Si hay error "relation does not exist en SQL Server", el nombre de tabla
-- en dbo.XXX puede ser diferente. Consultar en GELITE con:
--   SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' ORDER BY TABLE_NAME;