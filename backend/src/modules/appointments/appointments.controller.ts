// ─── Appointments Controller (Scaffold) ─────────────────
import { Request, Response, NextFunction } from 'express';
import { AppointmentsService } from './appointments.service.js';
import { logger } from '../../config/logger.js';

export class AppointmentsController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, ...await AppointmentsService.findAll(req.query as any) }); }
        catch (error) { next(error); }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try { res.json({ success: true, data: await AppointmentsService.findById(req.params.id) }); }
        catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const appt = await AppointmentsService.create(req.body);
            logger.info(`Cita creada: ${appt.id}`);
            res.status(201).json({ success: true, data: appt });
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const appt = await AppointmentsService.update(req.params.id, req.body);
            logger.info(`Cita actualizada: ${req.params.id}`);
            res.json({ success: true, data: appt });
        } catch (error) { next(error); }
    }

    static async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            await AppointmentsService.cancel(req.params.id);
            logger.info(`Cita cancelada: ${req.params.id}`);
            res.json({ success: true, data: { message: 'Cita cancelada' } });
        } catch (error) { next(error); }
    }
}
