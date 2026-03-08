// Migration: RegApun + DeudaCli + DocAdmin + PagoCli + LinAdmin (finanzas)
import sql from 'mssql';
import { gesdenConfig, log } from './config.js';

export async function migrateRegApun() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      ra.IdRegApun,
      ra.IdPac,
      p.NumPac,
      ra.IdCli,
      ra.IdTRegApun,
      CASE ra.IdTRegApun
        WHEN 1  THEN 'Factura'
        WHEN 2  THEN 'Comprobante de Pago'
        WHEN 3  THEN 'Abono'
        WHEN 4  THEN 'Pago'
        WHEN 5  THEN 'Deuda'
        WHEN 6  THEN 'Pago Deuda'
        WHEN 7  THEN 'Abono Deuda'
        WHEN 8  THEN 'Rectificativa'
        WHEN 9  THEN 'Gasto'
        WHEN 10 THEN 'Movimiento Bancario'
        WHEN 11 THEN 'Arqueo'
        WHEN 12 THEN 'Liquidacion'
        WHEN 13 THEN 'Transferencia'
        WHEN 14 THEN 'Ajuste'
        WHEN 15 THEN 'Redondeo'
        ELSE CAST(ra.IdTRegApun AS VARCHAR)
      END AS TipoApunte,
      ra.IdCol,
      CASE ra.IdCol
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      ra.IdForPago,
      ra.FecOperaci,
      ra.Importe,
      ra.Notas,
      ra.IdCentro
    FROM RegApun ra
    LEFT JOIN Pacientes p ON p.IdPac = ra.IdPac
    ORDER BY ra.IdRegApun
  `);

  log('RegApun', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migrateDeudaCli() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      dc.IdDeudaCli,
      dc.IdPac,
      p.NumPac,
      dc.IdCli,
      c.RazonSocial AS NombreCliente,
      dc.FecPlazo,
      dc.Adeudo,
      dc.Liquidado,
      dc.Pendiente,
      dc.NFactura,
      dc.NNotaTto,
      dc.Modalidad,
      dc.Incobrable,
      dc.IdCentro,
      dc._fechareg
    FROM DeudaCli dc
    LEFT JOIN Pacientes p ON p.IdPac = dc.IdPac
    LEFT JOIN Clientes  c ON c.IdCli = dc.IdCli
    ORDER BY dc.IdDeudaCli
  `);

  log('DeudaCli', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migrateDocAdmin() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      da.Ident,
      da.Doc,
      CASE da.Doc
        WHEN 'F' THEN 'Factura'
        WHEN 'R' THEN 'Recibo'
        WHEN 'C' THEN 'Comprobante'
        WHEN 'T' THEN 'Nota Tratamiento'
        WHEN 'A' THEN 'Abono'
        ELSE da.Doc
      END AS TipoDoc,
      da._Type AS TipoDocCompleto,
      da.Serie,
      da.NumDoc,
      da.Anyo,
      da.FecDoc,
      da.IdCli,
      ISNULL(da.RazonSocial, da.Nombre + ' ' + da.Apellidos) AS NombreCliente,
      da.NIF,
      da.IdEmisor,
      da.Abonado,
      da._fechareg
    FROM DocAdmin da
    ORDER BY da.Ident
  `);

  log('DocAdmin', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migratePagoCli() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      pg.IdPagoCli,
      pg.IdCli,
      c.RazonSocial AS NombreCliente,
      pg.IdForPago,
      CASE pg.IdForPago
        WHEN 1  THEN 'Domiciliacion'
        WHEN 2  THEN 'Efectivo'
        WHEN 3  THEN 'Letras'
        WHEN 4  THEN 'Mutua'
        WHEN 5  THEN 'Talon'
        WHEN 6  THEN 'Tarjeta'
        WHEN 7  THEN 'Transferencia'
        WHEN 8  THEN 'Financiacion'
        WHEN 14 THEN 'Pago Eurodent'
        ELSE CAST(pg.IdForPago AS VARCHAR)
      END AS FormaPago,
      pg.FecPago,
      pg.Pagado,
      pg.NRecibo,
      pg.Tipo,
      pg.IdCentro,
      pg._fechareg
    FROM PagoCli pg
    LEFT JOIN Clientes c ON c.IdCli = pg.IdCli
    ORDER BY pg.IdPagoCli
  `);

  log('PagoCli', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migrateLinAdmin() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      la.IdLinAdmin,
      la.IdDocAdmin,
      la.IdPac,
      p.NumPac,
      la.IdDeudaCli,
      la.IdPagoCli,
      la.Concepto,
      la.Importe,
      la.Abonado,
      la.Dto,
      la.ImporteDto,
      la.BaseImponible,
      la.IdTipoIVA,
      la.TpcIVA,
      la.ImporteIVA,
      la.Actos,
      la._fechareg
    FROM LinAdmin la
    LEFT JOIN Pacientes p ON p.IdPac = la.IdPac
    ORDER BY la.IdLinAdmin
  `);

  log('LinAdmin', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}
