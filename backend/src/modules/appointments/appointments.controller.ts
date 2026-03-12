// ─── Appointments Controller ────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { AppointmentsService } from './appointments.service.js';
import { logger } from '../../config/logger.js';

export class AppointmentsController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AppointmentsService.findAll(req.query as any);
            res.json({ success: true, ...result });
        } catch (error) {
            logger.error('Error listando citas:', error);
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            // ID format: "IdUsu-IdOrden"
            const [idUsu, idOrden] = req.params.id.split('-').map(Number);
            if (isNaN(idUsu) || isNaN(idOrden)) {
                res.status(400).json({ success: false, error: { message: 'ID inválido (formato: IdUsu-IdOrden)' } });
                return;
            }
            const data = await AppointmentsService.findById(idUsu, idOrden);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    // create/update/cancel: scaffold — DCitas es read-only desde GELITE
    static async create(_req: Request, res: Response) {
        res.status(501).json({ success: false, error: { message: 'DCitas es read-only (GELITE)' } });
    }

    static async update(_req: Request, res: Response) {
        res.status(501).json({ success: false, error: { message: 'DCitas es read-only (GELITE)' } });
    }

    static async cancel(_req: Request, res: Response) {
        res.status(501).json({ success: false, error: { message: 'DCitas es read-only (GELITE)' } });
    }
}
