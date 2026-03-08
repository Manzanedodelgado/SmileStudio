// Migration: DCitasF + DCitasOp + DCitasLogSit + Recalls (agenda)
import sql from 'mssql';
import { gesdenConfig, log } from './config.js';

export async function migrateDCitasF() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      f.IdUsu,
      CASE f.IdUsu
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      f.IdOrden,
      f.IdOpc,
      f.IdPac,
      p.NumPac,
      CONVERT(VARCHAR(10), DATEADD(DAY, f.Fecha - 2, '1900-01-01'), 23) AS Fecha,
      CONVERT(VARCHAR(5),  DATEADD(SECOND, f.Hora, 0), 108) AS Hora,
      CONVERT(NVARCHAR(MAX), f.Notas) AS Notas
    FROM DCitasF f
    LEFT JOIN Pacientes p ON p.IdPac = f.IdPac
    ORDER BY f.IdUsu, f.IdOrden
  `);

  log('DCitasF', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migrateDCitasOp() {
  const pool = await sql.connect(gesdenConfig);

  // DCitasOp only has 3 columns: IdUsu, IdOrden, IdOpc
  // The full type definitions are in TUsuAOpc
  const result = await pool.request().query(`
    SELECT
      o.IdUsu,
      CASE o.IdUsu
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      o.IdOrden,
      o.IdOpc,
      t.Descripcio AS DescripcionTipoCita,
      t.Duracion,
      t.Color,
      t.IdIcono
    FROM DCitasOp o
    LEFT JOIN TUsuAOpc t ON t.IdUsu = o.IdUsu AND t.IdOpc = o.IdOpc
    ORDER BY o.IdUsu, o.IdOrden
  `);

  log('DCitasOp', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migrateDCitasLogSit() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      l.IdCitasLogSit,
      l.IdUsu,
      CASE l.IdUsu
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      l.IdOrden,
      l.IdSitC,
      CASE l.IdSitC
        WHEN 0 THEN 'Planificada'
        WHEN 1 THEN 'Anulada'
        WHEN 5 THEN 'Finalizada'
        WHEN 7 THEN 'Confirmada'
        WHEN 8 THEN 'Cancelada'
        ELSE 'Desconocido'
      END AS EstadoCita,
      l.HorSitCita AS FecCambio,
      l.IdUserLog
    FROM DCitasLogSit l
    ORDER BY l.Id
  `);

  log('DCitasLogSit', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}

export async function migrateRecalls() {
  const pool = await sql.connect(gesdenConfig);

  const result = await pool.request().query(`
    SELECT
      r.Id,
      r.IdPac,
      p.NumPac,
      r.NumRec,
      CONVERT(VARCHAR(10), r.Fecha, 23) AS Fecha,
      r.Hora,
      r.IdMotivo,
      m.Descripcio AS MotivoRecall,
      r.IdResultado,
      CASE r.IdResultado
        WHEN 1 THEN 'Citado'
        WHEN 2 THEN 'Rechazado'
        ELSE 'Pendiente'
      END AS ResultadoRecall,
      r.Comentario,
      r.Observaciones,
      r.Telefono,
      r.EMail,
      r.SMS,
      r.Asistido,
      r.Citado,
      r.IdCol,
      CASE r.IdCol
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      r.FechaContacto,
      r.IdCentro,
      r._fechareg
    FROM Recalls r
    LEFT JOIN Pacientes p  ON p.IdPac     = r.IdPac
    LEFT JOIN TMRecall  m  ON m.IdMotivo  = r.IdMotivo
    ORDER BY r.Id
  `);

  log('Recalls', `Fetched ${result.recordset.length} rows`);
  await pool.close();
  return result.recordset;
}
