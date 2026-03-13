// ─── Inventory Routes ─────────────────────────────────────────────────────────
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { InventoryController } from './inventory.controller.js';

const router = Router();
router.use(authenticate);

router.get('/stats',    requirePermission('inventory:read'), InventoryController.getStats);
router.get('/products', requirePermission('inventory:read'), InventoryController.listProducts);
router.post('/products', requirePermission('inventory:write'), InventoryController.createProduct);
router.patch('/products/:id', requirePermission('inventory:write'), InventoryController.updateProduct);

router.post('/lots', requirePermission('inventory:write'), InventoryController.addLot);

router.get('/movements',  requirePermission('inventory:read'), InventoryController.listMovements);
router.post('/movements', requirePermission('inventory:write'), InventoryController.adjustStock);

router.get('/ai-order', requirePermission('inventory:read'), InventoryController.generatePreOrder);

export default router;
