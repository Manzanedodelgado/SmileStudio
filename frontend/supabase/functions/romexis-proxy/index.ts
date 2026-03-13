// ─────────────────────────────────────────────────────────────────
//  supabase/functions/romexis-proxy/index.ts
//  AUDITORÍA-VULN-001 FIX: Edge Function proxy para Romexis API.
//
//  El VITE_ROMEXIS_KEY ya NO va en el frontend.
//  La key vive en las variables de entorno de Supabase Edge (seguro).
//
//  CONFIGURAR EN SUPABASE DASHBOARD:
//    Project → Edge Functions → Secrets:
//    ROMEXIS_ENDPOINT = https://romexis.rubiogarciandental.com
//    ROMEXIS_KEY      = tu_api_key_romexis
//
//  FRONTEND llama a:
//    GET /functions/v1/romexis-proxy?path=/api/patients/ROM-XXX/images
//    GET /functions/v1/romexis-proxy?path=/api/patients?dni=12345678A
//    POST /functions/v1/romexis-proxy?path=/api/patients  (body: patient data)
//
//  DEPLOY:
//    supabase functions deploy romexis-proxy
// ─────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

// Paths permitidos (allowlist para evitar SSRF)
const ALLOWED_PATH_PREFIXES = [
    '/api/patients',
] as const;

Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
            },
        });
    }

    const endpoint = Deno.env.get('ROMEXIS_ENDPOINT');
    const apiKey = Deno.env.get('ROMEXIS_KEY');

    if (!endpoint || !apiKey) {
        // Romexis no configurado → devolver 503 (el frontend usa mock)
        return new Response(JSON.stringify({ error: 'Romexis not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Extraer el path solicitado del search param
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '';

    // Validar path contra allowlist (anti-SSRF)
    const isAllowed = ALLOWED_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
    if (!isAllowed || path.includes('..')) {
        return new Response(JSON.stringify({ error: 'Path not allowed' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Reconstruir la query string original (sin el param 'path')
    const queryParams = new URLSearchParams(url.search);
    queryParams.delete('path');
    const queryString = queryParams.toString();
    const targetUrl = `${endpoint}${path}${queryString ? '?' + queryString : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000); // 15s timeout

    try {
        const res = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: req.method !== 'GET' ? await req.text() : undefined,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        const responseText = await res.text();
        return new Response(responseText, {
            status: res.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            },
        });
    } catch (e) {
        clearTimeout(timeout);
        const message = e instanceof Error && e.name === 'AbortError'
            ? 'Romexis API timeout (>15s)'
            : 'Error contacting Romexis';
        return new Response(JSON.stringify({ error: message }), {
            status: 504,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
        });
    }
});
