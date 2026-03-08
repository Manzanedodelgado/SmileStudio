// ─── SmileStudio Backend Config ──────────────────────────
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().optional().default('redis://localhost:6379'),

    // Auth
    JWT_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Server
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    // IA
    GEMINI_API_KEY: z.string().optional(),

    // Storage
    UPLOAD_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof envSchema>;
