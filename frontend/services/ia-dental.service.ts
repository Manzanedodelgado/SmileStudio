// ─────────────────────────────────────────────────────────────────
//  services/ia-dental.service.ts
//  Servicio de IA Dental — usa Groq API vía Edge Function proxy.
//
//  AUDITORÍA-VULN-001 FIX:
//  Las llamadas a Groq ya NO van directamente al API desde el frontend.
//  Pasan por la Edge Function groq-proxy (Supabase Functions).
//  La GROQ_API_KEY vive en las variables de entorno de Supabase Edge.
//
//  Para activar: supabase functions deploy groq-proxy
//  Y añadir el secret: supabase secrets set GROQ_API_KEY=gsk_...
// ─────────────────────────────────────────────────────────────────

const GROQ_MODEL = 'llama-3.3-70b-versatile';

import { dbSelect, dbInsert, isDbConfigured, fetchWithTimeout } from './db';
import { logger } from './logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSupabaseUrl = (): string | null => (import.meta as any).env?.VITE_SUPABASE_URL || null;

/**
 * URL del proxy Edge Function para Groq.
 * Si Supabase no está configurado, devuelve null → fallback a respuestas predefinidas.
 */
const getProxyUrl = (): string | null => {
    const base = getSupabaseUrl();
    return base ? `${base}/functions/v1/groq-proxy` : null;
};

// Mantener compatibilidad: isAIConfigured = true si Supabase está configurado
export const isAIConfigured = (): boolean => !!getProxyUrl();

// ── Tipos ─────────────────────────────────────────────────────────

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// ── Persistencia historial chat en BBDD ───────────────────────────
// La tabla chat_history existía pero no estaba conectada (VLN-014)

interface ChatHistoryRow {
    id?: string;
    session_id: string;
    role: string;
    content: string;
    created_at?: string;
}

/**
 * Carga el historial de chat de una sesión desde Supabase.
 * Devuelve los últimos 20 mensajes ordenados por fecha.
 */
export const loadChatHistory = async (sessionId: string): Promise<{ role: string; text: string }[]> => {
    if (!isDbConfigured() || !sessionId) return [];
    try {
        const rows = await dbSelect<ChatHistoryRow>('chat_history', {
            session_id: `eq.${sessionId}`,
            order: 'created_at.asc',
            limit: '20',
        });
        return rows.map(r => ({ role: r.role, text: r.content }));
    } catch { return []; }
};

/**
 * Guarda un mensaje individual en la tabla chat_history (fire-and-forget).
 */
export const saveChatMessage = (sessionId: string, role: 'user' | 'assistant', content: string): void => {
    if (!isDbConfigured() || !sessionId) return;
    dbInsert<ChatHistoryRow>('chat_history', { session_id: sessionId, role, content })
        .catch(e => logger.warn('[IA Dental] Error saving chat message:', e));
};

// ── System Prompt ─────────────────────────────────────────────────

const buildSystemPrompt = (knowledgeBase: string[], clinicName: string = 'Rubio García Dental'): string => `
Eres IA Dental, el asistente virtual de ${clinicName} — Smile Pro 2026. Eres una IA especializada en odontología.

REGLAS ABSOLUTAS:
1. Responde SIEMPRE en español peninsular.
2. Sé cálida, empática y profesional. Nunca fría.
3. NUNCA diagnostiques. Sugiere siempre una consulta presencial.
4. Si detectas URGENCIA (dolor severo, sangrado, traumatismo) → escala inmediatamente: "🚨 Esto parece urgente. Llama al teléfono de urgencias de la clínica."
5. Si preguntan por precios exactos → "Cada caso es único. Te recomendamos una primera visita para un presupuesto personalizado."
6. Respuestas CORTAS (2-4 frases máximo). No hagas listas largas.
7. Usa emojis con moderación (máx 1-2 por mensaje).

BASE DE CONOCIMIENTO DE LA CLÍNICA:
${knowledgeBase.map(k => `• ${k}`).join('\n')}

Si no tienes la información, di honestamente que no lo sabes y sugiere contactar con la clínica.
`.trim();

// ── Llamada a Groq vía Edge Function proxy ──────────────────────

const callGroq = async (messages: ChatMessage[]): Promise<string> => {
    const proxyUrl = getProxyUrl();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (!proxyUrl) throw new Error('Supabase no configurado — IA no disponible');

    const res = await fetchWithTimeout(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey || '',
            'Authorization': `Bearer ${anonKey || ''}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 300,
            top_p: 0.9,
        }),
    }, 35_000); // 35s (Edge Function timeout = 30s + margen)

    if (!res.ok) {
        const errText = await res.text();
        logger.error('[IA Dental] groq-proxy error:', res.status, errText);
        throw new Error(`Groq proxy ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Lo siento, no he podido procesar tu mensaje.';
};

// ── Sanitización de input (VLN-005 FIX) ──────────────────────────

/**
 * Sanitiza el input del usuario antes de enviarlo al LLM.
 * Bloquea patrones de prompt injection y trunca a 500 caracteres.
 */
const sanitizeInput = (input: string): string => {
    const injectionPatterns = [
        /ignora\s+(todas\s+las\s+)?instrucciones/i,
        /olvida\s+(lo\s+que\s+te\s+)?(dije|dijeron|dicho)/i,
        /system\s*:/i,
        /\[INST\]|\[\/INST\]/,
        /<\|im_start\|>|<\|im_end\|>/,
        /act\s+as\s+(if\s+you\s+(are|were)|a)/i,
        /jailbreak|DAN\s+mode|do\s+anything\s+now/i,
    ];

    for (const pattern of injectionPatterns) {
        if (pattern.test(input)) {
            console.warn('[IA Dental] Prompt injection detectado y bloqueado');
            return '[Mensaje filtrado por política de seguridad de la clínica]';
        }
    }

    return input.trim().slice(0, 500);
};

// ── Fallback (respuestas estáticas si no hay API key) ─────────────

const fallbackReply = (userMsg: string): string => {
    const lower = userMsg.toLowerCase();
    if (lower.includes('cita') || lower.includes('reservar'))
        return 'Por supuesto, puedo ayudarte a reservar una cita. ¿Qué día y hora te viene mejor? 📅';
    if (lower.includes('precio') || lower.includes('cuánto') || lower.includes('cuesta'))
        return 'Cada caso es único. Te recomendamos una primera visita gratuita con nuestros especialistas para un presupuesto personalizado. ¿Te parece bien?';
    if (lower.includes('dolor') || lower.includes('urgencia') || lower.includes('sangr'))
        return '🚨 Entiendo que es urgente. Llama al teléfono de urgencias ahora. Si el dolor es muy severo, no esperes.';
    if (lower.includes('horario'))
        return 'Estamos de Lunes a Viernes de 8:30 a 20:00h y Sábados de 9:00 a 14:00h. ¿Quieres reservar una cita? 🕐';
    if (lower.includes('hola') || lower.includes('buenas'))
        return '¡Hola! Soy IA Dental, el asistente virtual de Smile Pro 2026. ¿En qué puedo ayudarte hoy? 😊';
    return 'Gracias por tu mensaje. ¿Hay algo específico sobre nuestros tratamientos o servicios en lo que pueda ayudarte?';
};

// ── API Pública ───────────────────────────────────────────────────

/**
 * Envía un mensaje a IA Dental y obtiene respuesta de IA.
 * Si Groq no está configurado o falla, usa fallback estático.
 */
export const askIA = async (
    userMessage: string,
    chatHistory: { role: string; text: string }[] = [],
    knowledgeBase: string[] = [],
    sessionId?: string  // VLN-014: sesión para persistir en chat_history
): Promise<string> => {
    // Si no hay API key, usar fallback
    if (!isAIConfigured()) {
        return fallbackReply(userMessage);
    }

    const sid = sessionId ?? 'session-anon';

    try {
        // Construir mensajes para Groq (formato OpenAI)
        const messages: ChatMessage[] = [
            { role: 'system', content: buildSystemPrompt(knowledgeBase) },
        ];

        // Añadir historial (últimos 10 mensajes para no exceder contexto)
        const recentHistory = chatHistory.slice(-10);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text,
            });
        }

        // Añadir mensaje actual (sanitizado — VLN-005)
        const sanitized = sanitizeInput(userMessage);
        messages.push({ role: 'user', content: sanitized });

        // VLN-014: persistir mensaje del usuario en chat_history
        saveChatMessage(sid, 'user', sanitized);

        const reply = await callGroq(messages);

        // VLN-014: persistir respuesta de IA Dental en chat_history
        saveChatMessage(sid, 'assistant', reply);

        return reply;
    } catch (e) {
        console.warn('[IA Dental] Fallback por error:', e);
        return fallbackReply(userMessage);
    }
};

/**
 * Analiza un odontograma y genera recomendaciones clínicas.
 * Recibe datos de dientes con estados y devuelve análisis en texto.
 */
export const analyzeOdontograma = async (
    toothData: { numero: string; caras: Record<string, string> }[]
): Promise<string> => {
    if (!isAIConfigured()) {
        return 'Conecta la API de IA para obtener análisis automático del odontograma.';
    }

    // Filtrar solo dientes con hallazgos (no "normal")
    const hallazgos = toothData
        .filter(d => Object.values(d.caras).some(c => c !== 'normal'))
        .map(d => {
            const carasAfectadas = Object.entries(d.caras)
                .filter(([, v]) => v !== 'normal')
                .map(([cara, estado]) => `${cara}: ${estado}`)
                .join(', ');
            return `Pieza ${d.numero}: ${carasAfectadas}`;
        });

    if (hallazgos.length === 0) {
        return 'Odontograma sin hallazgos patológicos. Todas las piezas en estado normal. ✅';
    }

    try {
        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: `Eres un asistente dental clínico. Analiza el odontograma y genera un resumen breve (máximo 5 puntos) con recomendaciones de tratamiento. Usa formato de lista con "»" al inicio. Responde en español. NO diagnostiques, solo sugiere posibles tratamientos a evaluar por el odontólogo.`
            },
            {
                role: 'user',
                content: `Analiza estos hallazgos del odontograma:\n${hallazgos.join('\n')}`
            }
        ];
        return await callGroq(messages);
    } catch {
        return hallazgos.map(h => `» ${h}`).join('\n');
    }
};
