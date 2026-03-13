// ─────────────────────────────────────────────────────────────────
//  supabase/functions/whatsapp-ia-handler/index.ts
//
//  Webhook receiver de Chatwoot para el agente IA WhatsApp.
//
//  CONFIGURAR EN CHATWOOT:
//    Admin → Settings → Integrations → Webhooks → New Webhook
//    URL: https://ltfstsjfybpbtiakopor.supabase.co/functions/v1/whatsapp-ia-handler
//    Events: ✅ message_created
//
//  SECRETS NECESARIOS (ya configurados):
//    GROQ_API_KEY — en Supabase Edge Function Secrets
// ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CHATWOOT_URL = Deno.env.get('CHATWOOT_URL') ?? '';
const CHATWOOT_TOKEN = Deno.env.get('CHATWOOT_TOKEN') ?? '';
const GROQ_PROXY_URL = `${SUPABASE_URL}/functions/v1/groq-proxy`;

// Tiempo de espera para agrupar mensajes consecutivos del paciente (ms)
const MESSAGE_AGGREGATION_DELAY = 8000;

// Tiempo de pausa manual de la IA (ms) = 5 minutos
const PAUSE_DURATION_MS = 5 * 60 * 1000;

// ── System Prompt del agente ─────────────────────────────────────
const SYSTEM_PROMPT = `Eres el servicio de atención al paciente de la clínica dental Rubio García Dental (Madrid).
Atiendes mensajes de WhatsApp en nombre de la clínica.

IDENTIDAD:
- No te presentes como IA ni chatbot. Eres el equipo de comunicación de la clínica.
- Si alguien pregunta si eres una IA: "Soy el servicio de atención de la clínica."
- Nombre clínica: Rubio García Dental. No inventes datos de contacto que no conozcas.

CONOCIMIENTOS CLÍNICOS (los tienes, los aplicas con criterio):
- Implantología: osteointegración, carga inmediata, levantamiento de seno, pilar, corona sobre implante, PRGF, membrana, regeneración ósea.
- Periodoncia: curetaje, raspado y alisado radicular, sondaje, bolsa periodontal, índice de placa, mantenimiento periodontal.
- Endodoncia: pulpectomía, pulpotomía, conductometría, obturación con gutapercha, retratamiento, diente con perno.
- Ortodoncia: brackets, alineadores (Invisalign/similares), retenedores, expansor, maloclusión, apiñamiento, mordida abierta/cruzada/profunda.
- Prostodoncia: corona, puente, póntico, carilla, incrustación (inlay/onlay), prótesis removible parcial/total, esquelético.
- Cirugía oral: exodoncia simple/compleja, cordal, alvéolo, suturas, postoperatorio, cuidados.
- Estética: blanqueamiento (domiciliario/clínica), composite, carilla de porcelana.
- Higiene: tartrectomía, profilaxis, pulido, instrucciones de higiene, boca seca, gingivitis.
- Diagnóstico: RX periapical, panorámica, TAC dental (CBCT), estudio de modelos.
- Urgencias: absceso, flegmón, fractura dental, avulsión, dolor agudo, hemorragia post-extracción.
- Fármacos comunes: amoxicilina, azitromicina, metronidazol, ibuprofeno, paracetamol, codeína, clorhexidina.

VOCABULARIO:
- Usa terminología técnica si el paciente la usa (ej: "curetaje", "implante de carga inmediata").
- Si el paciente usa lenguaje coloquial ("me duele la muela", "me han dicho que me falta hueso"), responde en su mismo registro manteniendo precisión.
- Siempre español de España. Evita latinismos o expresiones de otras variedades si no las usa el paciente.

TONO (CRÍTICO):
- Profesional, directo, claro. Sin relleno. Cero palabrería vacía.
- NO uses: "¡Claro que sí!", "Entiendo perfectamente", "¡Por supuesto!", "¡Genial!", "Por supuesto que sí".
- Una respuesta por turno. No interrumpas si el paciente envía varios mensajes seguidos.
- Respuestas concisas. Si puedes decirlo en 2 frases, no uses 5.

PRECIOS (MUY IMPORTANTE):
- Nunca precio fijo. Solo orientativos: "depende del caso clínico", "desde X€ aproximadamente", "el Dr. realiza el presupuesto en consulta, sin coste".
- Ejemplos válidos: "Una limpieza suele estar alrededor de 60-80€", "Los implantes varían mucho según el caso, normalmente desde 900€, pero necesita valoración".
- Si no sabes el orientativo: "El presupuesto lo hace el Dr. en consulta de valoración, que es gratuita".

CITAS (FLUJO ACTUAL — importante):
- De momento NO puedes confirmar ni crear citas directamente.
- Cuando un paciente quiera cita o información de disponibilidad, sigue este flujo:
  1. Pregunta el motivo de la consulta (si no lo ha dicho).
  2. Pregunta horario preferente (mañana/tarde, algún día concreto de la semana).
  3. Confirma: "Anotamos su solicitud. Nos pondremos en contacto para confirmar el día exacto lo antes posible."
  4. INTERNAMENTE (no lo escribas al paciente): genera una nota de cita pendiente en tu respuesta con formato especial:
     [NOTA_CITA]: Paciente: {nombre si lo sabes}, Motivo: {motivo}, Horario preferente: {horario}, Tel: {si lo tienes}
- Para urgencias (dolor agudo, absceso, fractura), responde: "Le atendemos hoy si hay hueco. Llame directamente al [teléfono de la clínica]" o indica que le llamaremos.

DOCUMENTOS Y TEMAS PENDIENTES:
- Si alguien pide un documento (consentimiento, presupuesto, informe), responde: "Gestionamos el envío. En breve le llegará por [canal]" o pide confirmar el email.
- Si están pendientes de entregar algo a la clínica: "Puede traerlo en su próxima visita o enviárnoslo por este WhatsApp."

PRIVACIDAD:
- No reveles información de otros pacientes.
- Si dicen ser familiar de un paciente: "Para información clínica de un familiar necesitamos su presencia junto al paciente o autorización firmada."
- Solo confirmas si alguien es paciente tuyo si pregunta sobre sí mismo.

LÍMITES:
- No diagnostiques. No prescribas. No des consejos clínicos específicos sin antes recomendar visita.
- Si hay urgencia real (dolor 8-10/10, inflamación, fiebre): deriva a llamada directa.
- Si no puedes resolver: "Le contactamos personalmente en breve."`;

// ── Tipos ────────────────────────────────────────────────────────
interface ChatwootWebhookPayload {
    event: string;
    conversation?: { id: number; inbox_id?: number };
    message?: {
        id: number;
        content: string;
        message_type: number; // 0=incoming, 1=outgoing
        content_type?: string;
        sender?: { name?: string; phone_number?: string };
    };
    account?: { id: number };
}

interface ChatwootMessage {
    content: string;
    message_type: number;
    created_at: number;
}

// ── Supabase helpers ─────────────────────────────────────────────
async function getIAStatus(convId: number): Promise<{ iaActive: boolean; autoResumeAt: string | null }> {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/ia_whatsapp_control?conversation_id=eq.${convId}&select=ia_active,auto_resume_at`,
        { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!res.ok) return { iaActive: true, autoResumeAt: null };
    const rows = await res.json() as { ia_active: boolean; auto_resume_at: string | null }[];
    if (!rows.length) return { iaActive: true, autoResumeAt: null };
    return { iaActive: rows[0].ia_active, autoResumeAt: rows[0].auto_resume_at };
}

async function setIAActive(convId: number, active: boolean): Promise<void> {
    await fetch(
        `${SUPABASE_URL}/rest/v1/ia_whatsapp_control`,
        {
            method: 'POST',
            headers: {
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
                conversation_id: String(convId),
                ia_active: active,
                auto_resume_at: active ? null : null,
                updated_at: new Date().toISOString(),
            }),
        }
    );
}

// ── Chatwoot helpers ─────────────────────────────────────────────
async function getConversationMessages(accountId: number, convId: number): Promise<ChatwootMessage[]> {
    if (!CHATWOOT_URL || !CHATWOOT_TOKEN) return [];
    const res = await fetch(
        `${CHATWOOT_URL}/api/v1/accounts/${accountId}/conversations/${convId}/messages`,
        { headers: { api_access_token: CHATWOOT_TOKEN } }
    );
    if (!res.ok) return [];
    const data = await res.json() as { payload?: ChatwootMessage[] };
    return (data.payload ?? []).slice(-20); // Últimos 20 mensajes para contexto
}

async function sendTypingIndicator(accountId: number, convId: number): Promise<void> {
    if (!CHATWOOT_URL || !CHATWOOT_TOKEN) return;
    await fetch(
        `${CHATWOOT_URL}/api/v1/accounts/${accountId}/conversations/${convId}/toggle_typing_status`,
        {
            method: 'POST',
            headers: { api_access_token: CHATWOOT_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({ typing_status: 'on' }),
        }
    );
}

async function sendChatwootReply(accountId: number, convId: number, content: string): Promise<void> {
    if (!CHATWOOT_URL || !CHATWOOT_TOKEN) return;
    await fetch(
        `${CHATWOOT_URL}/api/v1/accounts/${accountId}/conversations/${convId}/messages`,
        {
            method: 'POST',
            headers: { api_access_token: CHATWOOT_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, message_type: 'outgoing', private: false }),
        }
    );
}

// ── Groq proxy call ──────────────────────────────────────────────
async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
    const res = await fetch(GROQ_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            apikey: SUPABASE_SERVICE_KEY,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
            max_tokens: 400,
            temperature: 0.65,
        }),
    });
    if (!res.ok) throw new Error(`Groq proxy error: ${res.status}`);
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? 'Disculpe, en este momento no puedo atenderle. Le llamamos pronto.';
}

// ── Simular tiempo de escritura humano ───────────────────────────
function typingDelayMs(responseText: string): number {
    const words = responseText.split(' ').length;
    // ~60 palabras por minuto = 1 palabra/segundo, min 2s max 12s
    return Math.min(Math.max(words * 1000, 2000), 12000);
}

// ── Handler principal ────────────────────────────────────────────
Deno.serve(async (req: Request) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    let payload: ChatwootWebhookPayload;
    try {
        payload = await req.json();
    } catch {
        return new Response('Invalid JSON', { status: 400 });
    }

    // Solo procesar mensajes entrantes de pacientes
    if (payload.event !== 'message_created') {
        return new Response('OK', { status: 200 });
    }
    if (!payload.message || payload.message.message_type !== 0) {
        // message_type 0 = incoming (del paciente)
        return new Response('OK', { status: 200 });
    }
    // Ignorar mensajes sin texto (imágenes, etc.)
    if (!payload.message.content?.trim()) {
        return new Response('OK', { status: 200 });
    }

    const convId = payload.conversation?.id;
    const accountId = payload.account?.id ?? 1;
    if (!convId) return new Response('OK', { status: 200 });

    // Responder inmediatamente al webhook (Chatwoot espera <5s)
    // Procesamos la IA de forma asíncrona
    (async () => {
        try {
            // 1. Comprobar si la IA está activa para esta conversación
            const { iaActive, autoResumeAt } = await getIAStatus(convId);

            if (!iaActive) {
                // Verificar si ya pasaron los 5 min de pausa
                if (autoResumeAt && new Date(autoResumeAt) <= new Date()) {
                    await setIAActive(convId, true);
                    // Continúa con la IA activa
                } else {
                    // IA pausada, no respondemos
                    return;
                }
            }

            // 2. Esperar MESSAGE_AGGREGATION_DELAY para agrupar mensajes seguidos
            await new Promise(r => setTimeout(r, MESSAGE_AGGREGATION_DELAY));

            // 3. Leer historial actualizado de la conversación (con todos los mensajes agregados)
            const rawMessages = await getConversationMessages(accountId, convId);

            // Convertir mensajes de Chatwoot a formato Groq
            const history = rawMessages
                .filter(m => m.content?.trim())
                .map(m => ({
                    role: m.message_type === 0 ? 'user' : 'assistant',
                    content: m.content.trim(),
                }));

            if (!history.length) return;

            // 4. Simular typing (indicador visual en Chatwoot)
            await sendTypingIndicator(accountId, convId);

            // 5. Llamar a Groq
            const reply = await callGroq(history);

            // 6. Esperar el delay de "escritura humana"
            const delay = typingDelayMs(reply);
            await new Promise(r => setTimeout(r, delay));

            // 7. Enviar respuesta
            await sendChatwootReply(accountId, convId, reply);

        } catch (err) {
            console.error('[whatsapp-ia-handler] Error:', err);
        }
    })();

    return new Response('OK', { status: 200 });
});
