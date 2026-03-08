// ─── Accounting Controller (Scaffold) ───────────────────
import { Request, Response, NextFunction } from 'express';
import { AccountingService } from './accounting.service.js';

export class AccountingController {
    static async listInvoices(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, ...await AccountingService.getInvoices(req.query) }); } catch (e) { next(e); }
    }
    static async getInvoice(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, data: await AccountingService.getInvoiceById(req.params.id) }); } catch (e) { next(e); }
    }
    static async createInvoice(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json({ success: true, data: await AccountingService.createInvoice(req.body) }); } catch (e) { next(e); }
    }
    static async listPayments(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, ...await AccountingService.getPayments(req.query) }); } catch (e) { next(e); }
    }
    static async createPayment(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json({ success: true, data: await AccountingService.createPayment(req.body) }); } catch (e) { next(e); }
    }
    static async listBudgets(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, ...await AccountingService.getBudgets(req.query) }); } catch (e) { next(e); }
    }
    static async createBudget(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json({ success: true, data: await AccountingService.createBudget(req.body) }); } catch (e) { next(e); }
    }
    static async patientBalance(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, data: await AccountingService.getPatientBalance(req.params.patientId) }); } catch (e) { next(e); }
    }
}
