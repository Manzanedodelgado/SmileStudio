// ─── Auth Controller ────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { logger } from '../../config/logger.js';

export class AuthController {
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.login(req.body);
            logger.info(`Login exitoso: ${result.user.email}`);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await AuthService.register(req.body);
            logger.info(`Usuario registrado: ${user.email} (${user.role})`);
            res.status(201).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const tokens = await AuthService.refresh(req.body.refreshToken);
            res.json({ success: true, data: tokens });
        } catch (error) {
            next(error);
        }
    }

    static async me(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await AuthService.getProfile(req.user!.id);
            res.json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    static async logout(_req: Request, res: Response) {
        // With JWT, logout is client-side (discard tokens)
        // In a future iteration, add token blacklisting via Redis
        res.json({ success: true, data: { message: 'Sesión cerrada' } });
    }
}
