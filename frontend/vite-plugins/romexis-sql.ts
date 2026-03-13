/**
 * romexis-sql.ts — Plugin de Vite: Bridge SQL Server Romexis
 * ──────────────────────────────────────────────────────────
 * Endpoints (todos bajo /api/romexis/):
 *   GET /api/romexis/test                  → prueba de conexión
 *   GET /api/romexis/schema                → tablas de la BD (debug)
 *   GET /api/romexis/patients              → lista de pacientes (RRM_Person)
 *   GET /api/romexis/studies?patientId=X   → estudios del paciente (RIM_Study)
 *   GET /api/romexis/images?studyId=X      → imágenes de un estudio
 *
 * BD: Romexis_db @ bbddsql.servemp3.com:1434
 */

import type { Plugin } from 'vite';
import type { ServerResponse } from 'http';

const SQL_CONFIG = {
    server: process.env.ROMEXIS_HOST || 'bbddsql.servemp3.com',
    port: parseInt(process.env.ROMEXIS_PORT || '1433'),
    database: process.env.ROMEXIS_DB || 'romexis',
    user: process.env.ROMEXIS_USER || 'romexis',
    password: process.env.ROMEXIS_PASS || 'romexis',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 15000,
        requestTimeout: 15000,
    },
};

function sendJson(res: ServerResponse, data: unknown, status = 200) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
}

export function romexisSqlPlugin(): Plugin {
    return {
        name: 'romexis-sql-bridge',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url ?? '';
                if (!url.startsWith('/api/romexis/')) return next();

                const subpath = url.replace('/api/romexis/', '').split('?')[0];
                const searchParams = new URLSearchParams(
                    url.includes('?') ? url.split('?')[1] : ''
                );

                let mssql: any;
                try {
                    const mod = await import('mssql');
                    mssql = (mod as any).default ?? mod;
                } catch (e: any) {
                    return sendJson(res, { error: 'mssql no disponible: ' + e.message }, 500);
                }

                // ── test ──────────────────────────────────────────────────
                if (subpath === 'test') {
                    try {
                        const pool = await mssql.connect(SQL_CONFIG);
                        const result = await pool.request()
                            .query('SELECT @@VERSION AS version, DB_NAME() AS db, @@SERVERNAME AS server');
                        await pool.close();
                        return sendJson(res, { ok: true, ...result.recordset[0] });
                    } catch (e: any) {
                        return sendJson(res, { ok: false, error: e.message }, 500);
                    }
                }

                // ── schema ────────────────────────────────────────────────
                if (subpath === 'schema') {
                    try {
                        const pool = await mssql.connect(SQL_CONFIG);
                        const result = await pool.request().query(`
                            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
                            FROM INFORMATION_SCHEMA.COLUMNS
                            WHERE TABLE_SCHEMA = 'dbo'
                            ORDER BY TABLE_NAME, ORDINAL_POSITION
                        `);
                        await pool.close();
                        const schema: Record<string, string[]> = {};
                        for (const row of result.recordset) {
                            if (!schema[row.TABLE_NAME]) schema[row.TABLE_NAME] = [];
                            schema[row.TABLE_NAME].push(`${row.COLUMN_NAME} (${row.DATA_TYPE})`);
                        }
                        return sendJson(res, schema);
                    } catch (e: any) {
                        return sendJson(res, { error: e.message }, 500);
                    }
                }

                // ── patients — RRM_Person ─────────────────────────────────
                if (subpath === 'patients') {
                    try {
                        const pool = await mssql.connect(SQL_CONFIG);
                        const result = await pool.request().query(`
                            SELECT TOP 500
                                p.person_id,
                                p.first_name,
                                p.second_name,
                                p.last_name,
                                p.date_of_birth,
                                p.gender,
                                COUNT(s.study_id) AS study_count
                            FROM RRM_Person p
                            LEFT JOIN RIM_Study s ON s.patient_id = p.person_id AND s.status = 1
                            WHERE p.status = 1
                            GROUP BY p.person_id, p.first_name, p.second_name,
                                     p.last_name, p.date_of_birth, p.gender
                            ORDER BY p.last_name, p.first_name
                        `);
                        await pool.close();
                        return sendJson(res, result.recordset);
                    } catch (e: any) {
                        return sendJson(res, { error: e.message }, 500);
                    }
                }

                // ── studies?patientId=X — RIM_Study + RIM_Image_Info ──────
                if (subpath === 'studies') {
                    const patientId = searchParams.get('patientId');
                    if (!patientId) return sendJson(res, { error: 'patientId requerido' }, 400);
                    try {
                        const pool = await mssql.connect(SQL_CONFIG);
                        const result = await pool.request()
                            .input('pid', mssql.Int, parseInt(patientId))
                            .query(`
                                SELECT
                                    s.study_id,
                                    s.patient_id,
                                    s.study_date,
                                    s.study_time,
                                    s.study_comment,
                                    s.study_instance_uid,
                                    s.accession_number,
                                    COUNT(si.image_id) AS image_count,
                                    MAX(ii.image_type)  AS image_type,
                                    MAX(ii.image_format) AS image_format
                                FROM RIM_Study s
                                LEFT JOIN RIM_Study_Image si ON si.study_id = s.study_id AND si.status = 1
                                LEFT JOIN RIM_Image_Info ii ON ii.image_id = si.image_id AND ii.status = 1
                                WHERE s.patient_id = @pid AND s.status = 1
                                GROUP BY s.study_id, s.patient_id, s.study_date, s.study_time,
                                         s.study_comment, s.study_instance_uid, s.accession_number
                                ORDER BY s.study_date DESC, s.study_time DESC
                            `);
                        await pool.close();
                        return sendJson(res, result.recordset);
                    } catch (e: any) {
                        return sendJson(res, { error: e.message }, 500);
                    }
                }

                // ── images?studyId=X — imágenes de un estudio ────────────
                if (subpath === 'images') {
                    const studyId = searchParams.get('studyId');
                    if (!studyId) return sendJson(res, { error: 'studyId requerido' }, 400);
                    try {
                        const pool = await mssql.connect(SQL_CONFIG);
                        const result = await pool.request()
                            .input('sid', mssql.Int, parseInt(studyId))
                            .query(`
                                SELECT
                                    ii.image_id,
                                    ii.image_date,
                                    ii.image_time,
                                    ii.image_type,
                                    ii.image_subtype,
                                    ii.image_format,
                                    ii.image_size,
                                    ii.tooth_mask,
                                    ii.doctor_id,
                                    si.template_image_id
                                FROM RIM_Study_Image si
                                JOIN RIM_Image_Info ii ON ii.image_id = si.image_id AND ii.status = 1
                                WHERE si.study_id = @sid AND si.status = 1
                                ORDER BY ii.image_date, ii.image_time
                            `);
                        await pool.close();
                        return sendJson(res, result.recordset);
                    } catch (e: any) {
                        return sendJson(res, { error: e.message }, 500);
                    }
                }

                // ── debug?q=SQL — query ad-hoc (temporal, quitar en prod)
                if (subpath === 'debug') {
                    const q = searchParams.get('q');
                    if (!q) return sendJson(res, { error: 'q (query SQL) requerido' }, 400);
                    try {
                        const pool = await mssql.connect(SQL_CONFIG);
                        const result = await pool.request().query(q);
                        await pool.close();
                        return sendJson(res, result.recordset);
                    } catch (e: any) {
                        return sendJson(res, { error: e.message }, 500);
                    }
                }

                return sendJson(res, {
                    error: 'Endpoint no reconocido',
                    available: ['test', 'schema', 'patients', 'studies?patientId=X', 'images?studyId=X', 'debug?q=SQL']
                }, 404);
            });
        },
    };
}
