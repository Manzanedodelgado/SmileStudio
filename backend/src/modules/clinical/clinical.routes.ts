// ─── Clinical Routes (Scaffold) ─────────────────────────
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { ClinicalController } from './clinical.controller.js';

const router = Router();
router.use(authenticate);

router.get('/patients/:patientId/history', requirePermission('clinical:read'), ClinicalController.getHistory);
router.post('/records', requirePermission('clinical:write'), ClinicalController.createRecord);
router.get('/patients/:patientId/odontogram', requirePermission('clinical:read'), ClinicalController.getOdontogram);
router.put('/odontogram', requirePermission('clinical:write'), ClinicalController.updateOdontogram);
router.post('/prescriptions', requirePermission('clinical:write'), ClinicalController.createPrescription);

export default router;
