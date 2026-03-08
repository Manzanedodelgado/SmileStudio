// ─── Accounting Routes (Scaffold) ───────────────────────
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { AccountingController } from './accounting.controller.js';

const router = Router();
router.use(authenticate);

router.get('/invoices', requirePermission('accounting:read'), AccountingController.listInvoices);
router.get('/invoices/:id', requirePermission('accounting:read'), AccountingController.getInvoice);
router.post('/invoices', requirePermission('accounting:write'), AccountingController.createInvoice);

router.get('/payments', requirePermission('accounting:read'), AccountingController.listPayments);
router.post('/payments', requirePermission('accounting:write'), AccountingController.createPayment);

router.get('/budgets', requirePermission('accounting:read'), AccountingController.listBudgets);
router.post('/budgets', requirePermission('accounting:write'), AccountingController.createBudget);

router.get('/patients/:patientId/balance', requirePermission('accounting:read'), AccountingController.patientBalance);

export default router;
