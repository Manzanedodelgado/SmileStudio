// Migration: TtosMed + PresuTto + Presu (historial clínico)
import sql from 'mssql';
import { gesdenConfig, log } from './config.js';

export async function migrateTtosMed() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      tm.Ident,
      tm.IdPac,
      p.NumPac,
      tm.IdTto,
      tm.StaTto,
      CASE tm.StaTto
        WHEN 2 THEN 'En curso'
        WHEN 3 THEN 'Aceptado'
        WHEN 5 THEN 'Finalizado'
        ELSE CAST(tm.StaTto AS VARCHAR)
      END AS EstadoTto,
      tm.IdCol,
      CASE tm.IdCol
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      tm.FecIni,
      tm.FecFin,
      tm.Importe,
      tm.Dto,
      tm.Pendiente,
      tm.IdCentro,
      tm.PiezasAdu,
      tm.PiezasLec,
      tm.PiezasNum,
      tm._fechareg
    FROM TtosMed tm
    LEFT JOIN Pacientes p ON p.IdPac = tm.IdPac
    ORDER BY tm.Ident
  `);

  log('TtosMed', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migratePresu() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      p.Ident,
      p.IdPac,
      pac.NumPac,
      p.NumSerie,
      p.NumPre,
      p.Serie,
      p.NumSeriePresu,
      p.Titulo,
      p.FecPresup,
      p.FecAcepta,
      p.FecRechaz,
      p.Estado,
      p.IdCol,
      CASE p.IdCol
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      p.IdUserElabora,
      p.IdTipoPresupuesto,
      tp.Descripcion AS TipoPresupuesto,
      p.Notas,
      p.ObsRechaz,
      p.Financiacion,
      p.IdCentro,
      p._fechareg
    FROM Presu p
    LEFT JOIN Pacientes          pac ON pac.IdPac              = p.IdPac
    LEFT JOIN TiposPresupuestos   tp ON tp.IdTipoPresupuesto   = p.IdTipoPresupuesto
    ORDER BY p.Ident
  `);

  log('Presu', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migratePresuTto() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      pt.Ident,
      pt.IdPac,
      p.NumPac,
      pt.Id_Presu,
      pt.IdTto,
      pt.StaTto,
      CASE pt.StaTto
        WHEN 2 THEN 'En curso'
        WHEN 3 THEN 'Aceptado'
        WHEN 5 THEN 'Finalizado'
        WHEN 6 THEN 'Rechazado'
        WHEN 7 THEN 'Pendiente'
        ELSE CAST(pt.StaTto AS VARCHAR)
      END AS EstadoTto,
      pt.IdCol,
      CASE pt.IdCol
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      pt.ImportePre AS Importe,
      pt.Dto,
      pt.PiezasAdu,
      pt.PiezasLec,
      pt.PiezasNum,
      pt.FecIni,
      pt.FecFin,
      pt.Ident
    FROM PresuTto pt
    LEFT JOIN Pacientes p ON p.IdPac = pt.IdPac
    ORDER BY pt.Ident
  `);

  log('PresuTto', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}
