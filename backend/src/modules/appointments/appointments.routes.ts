// ─── Appointments Routes (Scaffold) ─────────────────────
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { AppointmentsController } from './appointments.controller.js';
import { createAppointmentSchema, updateAppointmentSchema } from './appointments.schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('appointments:read'), AppointmentsController.list);
router.get('/:id', requirePermission('appointments:read'), AppointmentsController.getById);
router.post('/', requirePermission('appointments:write'), validate(createAppointmentSchema), AppointmentsController.create);
router.put('/:id', requirePermission('appointments:write'), validate(updateAppointmentSchema), AppointmentsController.update);
router.patch('/:id/cancel', requirePermission('appointments:write'), AppointmentsController.cancel);

export default router;
