// ─── JWT Authentication Middleware ───────────────────────
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { UserRole } from '@prisma/client';

// Extend Express Request to include user
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    name: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 401) {
        super(message);
        this.name = 'AuthError';
        this.statusCode = statusCode;
    }
}

/**
 * Middleware: Verify JWT access token from Authorization header
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        next(new AuthError('Token de acceso no proporcionado'));
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUser;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(new AuthError('Token expirado'));
        } else {
            next(new AuthError('Token inválido'));
        }
    }
}

/**
 * Middleware: Optional authentication — sets req.user if token is present but doesn't require it
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUser;
        req.user = decoded;
    } catch {
        // Token invalid/expired — continue without user
    }

    next();
}
