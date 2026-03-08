// ─── Clinical Controller (Scaffold) ─────────────────────
import { Request, Response, NextFunction } from 'express';
import { ClinicalService } from './clinical.service.js';

export class ClinicalController {
    static async getHistory(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, data: await ClinicalService.getPatientHistory(req.params.patientId) }); }
        catch (error) { next(error); }
    }

    static async createRecord(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json({ success: true, data: await ClinicalService.createRecord(req.body) }); }
        catch (error) { next(error); }
    }

    static async getOdontogram(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, data: await ClinicalService.getOdontogram(req.params.patientId) }); }
        catch (error) { next(error); }
    }

    static async updateOdontogram(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, data: await ClinicalService.updateOdontogram(req.body) }); }
        catch (error) { next(error); }
    }

    static async createPrescription(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json({ success: true, data: await ClinicalService.createPrescription(req.body) }); }
        catch (error) { next(error); }
    }
}
