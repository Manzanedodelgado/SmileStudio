// ─── AI Agent Routes (Scaffold) ─────────────────────────
// Agente IA central: WhatsApp, Copiloto clínico, Autoevolución
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

// ─── 1. AGENTE WHATSAPP (llamado internamente desde comms webhook) ───
// No es un endpoint público — se invoca desde modules/communication
// cuando llega un mensaje de Evolution API

// ─── 2. COPILOTO CLÍNICO (usado por staff desde el frontend) ───
router.use(authenticate);

// Chat con el copiloto — asiste en notas, diagnóstico, tratamiento
router.post('/copilot/chat', requirePermission('ai:use'), (_req, res) => {
    // TODO: Enviar contexto + prompt a Gemini/Groq
    // → Recibir sugerencia
    // → Devolver al frontend
    res.json({ success: true, data: { response: 'TODO: Respuesta del copiloto IA' } });
});

// Completar nota de visita automáticamente
router.post('/copilot/complete-note', requirePermission('ai:use'), (_req, res) => {
    // TODO: Recibe nota parcial, la completa con contexto del paciente
    res.json({ success: true, data: { completedNote: 'TODO: Nota completada por IA' } });
});

// Sugerir tratamiento basado en historial
router.post('/copilot/suggest-treatment', requirePermission('ai:use'), (_req, res) => {
    // TODO: Analiza historial del paciente y sugiere tratamientos
    res.json({ success: true, data: { suggestions: [] } });
});

// Analizar radiografía
router.post('/copilot/analyze-image', requirePermission('ai:use'), (_req, res) => {
    // TODO: Enviar imagen a Gemini Vision
    res.json({ success: true, data: { analysis: 'TODO: Análisis radiográfico IA' } });
});

// ─── 3. AUTOEVOLUCIÓN ───
// Endpoint admin para que la IA analice uso y proponga mejoras
router.get('/evolution/insights', requirePermission('admin:read'), (_req, res) => {
    // TODO: Analizar patrones de uso, errores frecuentes, sugerir mejoras
    res.json({ success: true, data: { insights: [], improvements: [] } });
});

// Historial de conversaciones con IA
router.get('/conversations', requirePermission('ai:use'), (_req, res) => {
    res.json({ success: true, data: [] });
});

export default router;
