// ─── Inventory Controller ─────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import * as svc from './inventory.service.js';

export const InventoryController = {

    // GET /api/inventory/products
    async listProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await svc.listProducts();
            res.json({ success: true, data });
        } catch (e) { next(e); }
    },

    // POST /api/inventory/products
    async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, sku, category, minReorder } = req.body;
            if (!name || !sku) {
                res.status(400).json({ success: false, error: { message: 'name y sku son obligatorios' } });
                return;
            }
            const data = await svc.createProduct({ name, sku, category: category ?? 'Desechable', minReorder: minReorder ?? 10 });
            res.status(201).json({ success: true, data });
        } catch (e) { next(e); }
    },

    // PATCH /api/inventory/products/:id
    async updateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await svc.updateProduct(req.params.id, req.body);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    },

    // POST /api/inventory/lots
    async addLot(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId, lotNumber, expiryDate, quantity, location } = req.body;
            if (!productId || !lotNumber || quantity === undefined) {
                res.status(400).json({ success: false, error: { message: 'productId, lotNumber y quantity son obligatorios' } });
                return;
            }
            const data = await svc.addLot({ productId, lotNumber, expiryDate, quantity, location });
            res.status(201).json({ success: true, data });
        } catch (e) { next(e); }
    },

    // POST /api/inventory/movements
    async adjustStock(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId, lotId, quantity, reason } = req.body;
            if (!productId || quantity === undefined || !reason) {
                res.status(400).json({ success: false, error: { message: 'productId, quantity y reason son obligatorios' } });
                return;
            }
            const userId = (req as any).user?.id;
            const data = await svc.adjustStock({ productId, lotId, quantity, reason, userId });
            res.status(201).json({ success: true, data });
        } catch (e) { next(e); }
    },

    // GET /api/inventory/movements
    async listMovements(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.query;
            const data = await svc.listMovements(productId as string | undefined);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    },

    // GET /api/inventory/stats
    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await svc.getStats();
            res.json({ success: true, data });
        } catch (e) { next(e); }
    },

    // GET /api/inventory/ai-order
    async generatePreOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await svc.generatePreOrder();
            res.json({ success: true, data });
        } catch (e) { next(e); }
    },
};
