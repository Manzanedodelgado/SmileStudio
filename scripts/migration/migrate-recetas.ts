// Migration: RecetasCab + RecetasDet + TTratamientos + ExplPerio + TDocumentosPac
import sql from 'mssql';
import { gesdenConfig, log } from './config.js';

export async function migrateRecetasCab() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      rc.IdPac,
      p.NumPac,
      rc.IdUsu,
      CASE rc.IdUsu
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      rc.IdCol,
      rc.Fecha,
      rc.Descripcio,
      rc.FecIns,
      rc.IdEmisor,
      rc.Notas,
      rc.Diagnostico,
      rc.TipoReceta,
      rc.Anulada,
      rc.Dispensada,
      rc.NumImpresiones,
      rc.IdCentro,
      rc.CVE
    FROM RecetasCab rc
    LEFT JOIN Pacientes p ON p.IdPac = rc.IdPac
    ORDER BY rc.IdPac, rc.Fecha
  `);

    log('RecetasCab', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}

export async function migrateRecetasDet() {
    const pool = await sql.connect(gesdenConfig);

    --RecetasDet shares IdPac with RecetasCab
  const result = await pool.request().query(`
    SELECT
      rd.*,
      p.NumPac
    FROM RecetasDet rd
    LEFT JOIN Pacientes p ON p.IdPac = rd.IdPac
    ORDER BY rd.IdPac
  `);

    log('RecetasDet', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}

export async function migrateTTratamientos() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      tt.IdPac,
      p.NumPac,
      tt.IdTrat,
      tt.IdFarmaco,
      tt.DescFarmaco,
      tt.Dosificacion,
      tt.Dosis,
      tt.ViaAdmin,
      tt.Frecuencia,
      tt.Observac,
      tt.FecIns,
      tt.Fecha,
      tt.FecFin,
      tt.Tipo,
      tt.IdUsu,
      CASE tt.IdUsu
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      tt.Publico,
      tt.IdCentro
    FROM TTratamientos tt
    LEFT JOIN Pacientes p ON p.IdPac = tt.IdPac
    ORDER BY tt.IdPac, tt.FecIns
  `);

    log('TTratamientos', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}

export async function migrateExplPerio() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      ep.Id,
      ep.IdPac,
      p.NumPac,
      ep.IdExplPer,
      ep.NDent,
      ep.borsa1, ep.borsa2, ep.borsa3, ep.borsa4, ep.borsa5, ep.borsa6,
      ep.recessio1, ep.recessio2, ep.recessio3, ep.recessio4, ep.recessio5, ep.recessio6,
      ep.sangrat1, ep.sangrat2, ep.sangrat3, ep.sangrat4,
      ep.placa1, ep.placa2, ep.placa3, ep.placa4,
      ep.movilitat1, ep.movilitat2,
      ep.Id_PacPerio,
      ep._fechaReg
    FROM ExplPerio ep
    LEFT JOIN Pacientes p ON p.IdPac = ep.IdPac
    ORDER BY ep.IdPac, ep.Id
  `);

    log('ExplPerio', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}

export async function migrateTDocumentosPac() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      dp.IdDocPac,
      dp.IdPac,
      p.NumPac,
      dp.FechaDoc,
      dp.Descripcion,
      dp.TipoDoc,
      dp.IdCentro,
      dp.IdUsu,
      CASE dp.IdUsu
        WHEN 3  THEN 'Dr. Mario Rubio'
        WHEN 4  THEN 'Dra. Irene Garcia'
        WHEN 8  THEN 'Dra. Virginia Tresgallo'
        WHEN 10 THEN 'Dra. Miriam Carrasco'
        WHEN 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN 13 THEN 'Dr. Ignacio Ferrero'
        ELSE 'Odontologo'
      END AS Odontologo,
      dp.FechaIns
    FROM TDocumentosPac dp
    LEFT JOIN Pacientes p ON p.IdPac = dp.IdPac
    ORDER BY dp.IdPac, dp.FecDoc
  `);

    log('TDocumentosPac', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}
