// ─── Patients Routes (Scaffold) ─────────────────────────
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { PatientsController } from './patients.controller.js';
import { createPatientSchema, updatePatientSchema, patientQuerySchema } from './patients.schemas.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('patients:read'), PatientsController.list);
router.get('/:id', requirePermission('patients:read'), PatientsController.getById);
router.post('/', requirePermission('patients:write'), validate(createPatientSchema), PatientsController.create);
router.put('/:id', requirePermission('patients:write'), validate(updatePatientSchema), PatientsController.update);
router.delete('/:id', requirePermission('patients:write'), PatientsController.remove);

export default router;
