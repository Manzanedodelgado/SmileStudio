// ─────────────────────────────────────────────────────────────────
//  supabase/functions/groq-proxy/index.ts
//  AUDITORÍA-VULN-001 FIX: Edge Function proxy para Groq API.
//
//  El VITE_GROQ_API_KEY ya NO va en el frontend.
//  La key vive en las variables de entorno de Supabase Edge (seguro).
//
//  CONFIGURAR EN SUPABASE DASHBOARD:
//    Project → Edge Functions → Secrets:
//    GROQ_API_KEY = gsk_tu_key_aqui
//
//  FRONTEND llama a:
//    POST /functions/v1/groq-proxy
//    Body: { model, messages, temperature, max_tokens, top_p }
//
//  DEPLOY:
//    supabase functions deploy groq-proxy --no-verify-jwt
// ─────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

// Modelos permitidos (allowlist para evitar abusos)
const ALLOWED_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
] as const;

Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Groq not configured in server' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Validar modelo para evitar abusos (el cliente no puede elegir modelos costosos)
    const model = body.model as string;
    if (!ALLOWED_MODELS.includes(model as typeof ALLOWED_MODELS[number])) {
        body = { ...body, model: 'llama-3.3-70b-versatile' }; // Forzar modelo permitido
    }

    // Limitar max_tokens para controlar costes
    const maxTokens = Math.min(Number(body.max_tokens) || 300, 1000);
    body = { ...body, max_tokens: maxTokens };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    try {
        const res = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
            ? 'Groq API timeout (>30s)'
            : 'Error contacting Groq API';
        return new Response(JSON.stringify({ error: message }), {
            status: 504,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
        });
    }
});
