// ─────────────────────────────────────────────────────────────────
//  supabase/functions/whatsapp-webhook/index.ts
//  VLN-010 FIX: Valida X-Hub-Signature-256 de Meta antes de procesar
//  webhooks de WhatsApp.
//
//  Despliegue:
//    supabase functions deploy whatsapp-webhook --no-verify-jwt
//
//  Config (secrets en Supabase Dashboard > Edge Functions):
//    WHATSAPP_VERIFY_TOKEN = tu token de verificación en Meta Developer
//    WHATSAPP_APP_SECRET   = app secret de Meta (para HMAC-SHA256)
// ─────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '';
const APP_SECRET = Deno.env.get('WHATSAPP_APP_SECRET') ?? '';

// ── HMAC-SHA256 con Web Crypto API (Deno-compatible) ─────────────
async function verifySignature(body: string, signature: string): Promise<boolean> {
    if (!APP_SECRET || !signature) return false;

    const sigParts = signature.split('=');
    if (sigParts.length !== 2 || sigParts[0] !== 'sha256') return false;

    const receivedHex = sigParts[1];

    const encoder = new TextEncoder();
    const keyData = encoder.encode(APP_SECRET);
    const bodyData = encoder.encode(body);

    const key = await crypto.subtle.importKey(
        'raw', keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyData);
    const signatureHex = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Constant-time comparison para evitar timing attacks
    if (receivedHex.length !== signatureHex.length) return false;
    let diff = 0;
    for (let i = 0; i < receivedHex.length; i++) {
        diff |= receivedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
    }
    return diff === 0;
}

serve(async (req: Request) => {
    const url = new URL(req.url);

    // ── GET: Verificación de webhook por Meta ─────────────────────
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[Webhook] Verificación Meta OK');
            return new Response(challenge, { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
    }

    // ── POST: Evento entrante ─────────────────────────────────────
    if (req.method === 'POST') {
        const rawBody = await req.text();
        const sigHeader = req.headers.get('x-hub-signature-256') ?? '';

        // VLN-010 FIX: Verificar firma antes de procesar
        const isValid = await verifySignature(rawBody, sigHeader);
        if (!isValid) {
            console.error('[Webhook] Firma inválida — posible forjado de mensaje');
            return new Response('Unauthorized', { status: 401 });
        }

        let payload: any;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            return new Response('Bad Request', { status: 400 });
        }

        // ── Procesar mensajes entrantes ───────────────────────────
        if (payload.object === 'whatsapp_business_account') {
            for (const entry of payload.entry ?? []) {
                for (const change of entry.changes ?? []) {
                    if (change.field === 'messages') {
                        const messages = change.value?.messages ?? [];
                        for (const msg of messages) {
                            console.log('[Webhook] Mensaje recibido:', {
                                from: msg.from,
                                type: msg.type,
                                timestamp: msg.timestamp,
                                messageId: msg.id,
                            });
                            // TODO: guardar en tabla mensajes_whatsapp,
                            // disparar respuesta automática via IA Dental,
                            // o reenviar a Chatwoot vía Evolution API
                        }
                    }
                }
            }
        }

        // Meta requiere 200 inmediato para no reintentar
        return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response('Method Not Allowed', { status: 405 });
});
