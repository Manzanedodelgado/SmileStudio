// ─── Appointments Routes ────────────────────────────────
import { Router } from 'express';
import { AppointmentsController } from './appointments.controller.js';

const router = Router();

// Lectura — sin auth temporalmente (tabla User no migrada aún)
router.get('/', AppointmentsController.list);
router.get('/:id', AppointmentsController.getById);

// Escritura — DCitas es read-only (GELITE)
router.post('/', AppointmentsController.create);
router.put('/:id', AppointmentsController.update);
router.patch('/:id/cancel', AppointmentsController.cancel);

export default router;
