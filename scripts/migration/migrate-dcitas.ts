// Migration: DCitas → SmileStudio appointments
// Uses exact field mappings provided by client

import sql from 'mssql';
import { gesdenConfig, log, mapIdUsu, mapIdSitC, mapIdIcono, mapFecha, mapHora, mapDuracion, mapTexto } from './config.js';

export async function migrateDCitas() {
    log('DCitas', 'Connecting to GELITE...');
    const pool = await sql.connect(gesdenConfig);

    const result = await pool.request().query(`
    SELECT
      IdCita                                                    AS Registro,
      HorSitCita                                                AS CitMod,
      FecAlta                                                   AS FechaAlta,
      NUMPAC                                                    AS NumPac,
      CASE
        WHEN CHARINDEX(',', Texto) > 0
        THEN LTRIM(RTRIM(LEFT(Texto, CHARINDEX(',', Texto) - 1)))
        ELSE NULL
      END                                                       AS Apellidos,
      CASE
        WHEN CHARINDEX(',', Texto) > 0
        THEN LTRIM(RTRIM(SUBSTRING(Texto, CHARINDEX(',', Texto) + 1, LEN(Texto))))
        ELSE Texto
      END                                                       AS Nombre,
      Movil                                                     AS TelMovil,
      CONVERT(VARCHAR(10), DATEADD(DAY, Fecha - 2, '1900-01-01'), 23) AS Fecha,
      CONVERT(VARCHAR(5),  DATEADD(SECOND, Hora, 0), 108)      AS Hora,
      CASE
        WHEN IdSitC = 0 THEN 'Planificada'
        WHEN IdSitC = 1 THEN 'Anulada'
        WHEN IdSitC = 5 THEN 'Finalizada'
        WHEN IdSitC = 7 THEN 'Confirmada'
        WHEN IdSitC = 8 THEN 'Cancelada'
        ELSE 'Desconocido'
      END                                                       AS EstadoCita,
      CASE
        WHEN IdIcono = 1  THEN 'Control'
        WHEN IdIcono = 2  THEN 'Urgencia'
        WHEN IdIcono = 3  THEN 'Protesis Fija'
        WHEN IdIcono = 4  THEN 'Cirugia/Injerto'
        WHEN IdIcono = 6  THEN 'Retirar Ortodoncia'
        WHEN IdIcono = 7  THEN 'Protesis Removible'
        WHEN IdIcono = 8  THEN 'Colocacion Ortodoncia'
        WHEN IdIcono = 9  THEN 'Periodoncia'
        WHEN IdIcono = 10 THEN 'Cirugia de Implante'
        WHEN IdIcono = 11 THEN 'Mensualidad Ortodoncia'
        WHEN IdIcono = 12 THEN 'Ajuste Prot/tto'
        WHEN IdIcono = 13 THEN 'Primera Visita'
        WHEN IdIcono = 14 THEN 'Higiene Dental'
        WHEN IdIcono = 15 THEN 'Endodoncia'
        WHEN IdIcono = 16 THEN 'Reconstruccion'
        WHEN IdIcono = 17 THEN 'Exodoncia'
        WHEN IdIcono = 18 THEN 'Estudio Ortodoncia'
        WHEN IdIcono = 19 THEN 'Rx/escaner'
        ELSE 'Otros'
      END                                                       AS Tratamiento,
      CASE
        WHEN IdUsu = 3  THEN 'Dr. Mario Rubio'
        WHEN IdUsu = 4  THEN 'Dra. Irene Garcia'
        WHEN IdUsu = 8  THEN 'Dra. Virginia Tresgallo'
        WHEN IdUsu = 13 THEN 'Dr. Ignacio Ferrero'
        WHEN IdUsu = 12 THEN 'Tc. Juan Antonio Manzanedo'
        WHEN IdUsu = 10 THEN 'Dra. Miriam Carrasco'
        ELSE 'Odontologo'
      END                                                       AS Odontologo,
      CONVERT(NVARCHAR(MAX), NOTAS)                             AS Notas,
      CAST(CAST(Duracion AS DECIMAL(10,2)) / 60 AS INT)        AS Duracion,
      IdPac,
      IdUsu,
      IdSitC,
      IdIcono,
      IdCol,
      IdCentro,
      IdCli,
      FlgBloqueo,
      Contacto,
      Email,
      NIF,
      IdTarifa,
      Confirmada,
      Recordada,
      FecNacim,
      MotivoAnulacion,
      Retraso,
      IdBox,
      IdRef,
      IdPartner,
      IdCia
    FROM DCitas
    ORDER BY IdCita
  `);

    log('DCitas', `Fetched ${result.recordset.length} rows`);

    await pool.close();
    return result.recordset;
}
