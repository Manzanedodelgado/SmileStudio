// ─── Communication Routes (Scaffold) ────────────────────
// WhatsApp via Evolution API
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

// Webhook de Evolution API (NO requiere auth — lo llama Evolution)
router.post('/webhook/evolution', (req, res) => {
    // TODO: Recibir mensajes entrantes de WhatsApp
    // → Pasar al agente IA para respuesta automática
    // → Guardar en tabla messages
    console.log('WhatsApp webhook:', JSON.stringify(req.body).substring(0, 200));
    res.json({ success: true });
});

// Rutas autenticadas
router.use(authenticate);

// Enviar mensaje WhatsApp
router.post('/whatsapp/send', requirePermission('comms:write'), (_req, res) => {
    // TODO: Enviar mensaje vía Evolution API
    res.json({ success: true, message: 'TODO: Enviar WhatsApp vía Evolution API' });
});

// Listar conversaciones
router.get('/whatsapp/conversations', requirePermission('comms:read'), (_req, res) => {
    res.json({ success: true, data: [], message: 'TODO: Listar conversaciones' });
});

// Enviar recordatorio de cita
router.post('/reminders/send', requirePermission('comms:write'), (_req, res) => {
    // TODO: Enviar recordatorio de cita por WhatsApp
    res.json({ success: true, message: 'TODO: Enviar recordatorio' });
});

export default router;
