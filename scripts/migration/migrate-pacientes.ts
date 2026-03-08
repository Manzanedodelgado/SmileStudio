// Migration: Pacientes + Clientes + PacCli + AlertPac + Pacientes_Tarifas
import sql from 'mssql';
import { gesdenConfig, log } from './config.js';

export async function migratePacientes() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      p.IdPac,
      p.NumPac,
      p.Nombre,
      p.Apellidos,
      p.NIF,
      p.Direccion,
      p.IdPoblacio,
      p.CP,
      p.Tel1,
      p.Tel2,
      p.TelMovil,
      p.Email,
      p.FecNacim,
      CASE p.Sexo WHEN 'H' THEN 'Hombre' WHEN 'M' THEN 'Mujer' ELSE 'Desconocido' END AS Sexo,
      p.Notas,
      p.FecAlta,
      p.Inactivo,
      p.AceptaSMS,
      p.AceptaEmail,
      p.AceptaWhatsApp,
      p.AceptaGDPR,
      p.IdCli,
      p.IdCentro,
      p.IdEcivil,
      p.IdProfesio,
      p.Foto,
      p._fechareg,
      pop.Descripcio AS Poblacion,
      pro.Descripcio AS Provincia
    FROM Pacientes p
    LEFT JOIN TPoblaci pop ON pop.IdPoblacio = p.IdPoblacio
    LEFT JOIN TProvin pro ON pro.IdProvin = pop.IdProvin
    ORDER BY p.IdPac
  `);

    log('Pacientes', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}

export async function migrateClientes() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      c.IdCli,
      c.TipoCli,
      CASE c.TipoCli
        WHEN 'O' THEN 'Particular'
        WHEN 'F' THEN 'Financiera'
        WHEN 'M' THEN 'Mutua/Seguro'
        ELSE c.TipoCli
      END AS TipoCliDesc,
      ISNULL(c.RazonSocial, ISNULL(c.Nombre + ' ' + c.Apellidos, c.Nombre)) AS Nombre,
      c.NIF,
      c.Direccion,
      c.IdPoblacio,
      c.CP,
      c.Tel1,
      c.Tel2,
      c.TelMovil,
      c.Email,
      c.SISTEMA,
      c.TARIFA,
      c.FecAlta,
      c.FecBaja,
      c.Inactivo,
      c.IdCentro,
      c.CodIBAN,
      c.Notas,
      c._fechareg,
      pop.Descripcio AS Poblacion
    FROM Clientes c
    LEFT JOIN TPoblaci pop ON pop.IdPoblacio = c.IdPoblacio
    ORDER BY c.IdCli
  `);

    log('Clientes', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}

export async function migratePacCli() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      pc.IdPac,
      p.NumPac,
      pc.IdCli,
      c.RazonSocial AS NombreCliente,
      c.TipoCli
    FROM PacCli pc
    LEFT JOIN Pacientes p ON p.IdPac = pc.IdPac
    LEFT JOIN Clientes c  ON c.IdCli  = pc.IdCli
    ORDER BY pc.IdPac
  `);

    log('PacCli', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}

export async function migrateAlertPac() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      a.Id,
      a.IdPac,
      p.NumPac,
      a.NumAlerta,
      a.Texto,
      a.Marcado,
      a.IdCentro,
      a._fechareg
    FROM AlertPac a
    LEFT JOIN Pacientes p ON p.IdPac = a.IdPac
    ORDER BY a.IdPac, a.NumAlerta
  `);

    log('AlertPac', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}

export async function migratePacientesTarifas() {
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      pt.IdPac,
      p.NumPac,
      pt.IdTarifa,
      t.Descripcion AS NombreTarifa,
      
      pt.FecAlta,
      pt.FecCaduc AS FecBaja,
      pt.IdCentro
    FROM Pacientes_Tarifas pt
    LEFT JOIN Pacientes p ON p.IdPac  = pt.IdPac
    LEFT JOIN Tarifas   t ON t.IdTarifa = pt.IdTarifa
    ORDER BY pt.IdPac
  `);

    log('Pacientes_Tarifas', `Fetched ${result.recordset.length} rows`);
    await pool.close();
    return result.recordset;
}
