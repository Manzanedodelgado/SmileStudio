// ─── Patients Zod Schemas ───────────────────────────────
import { z } from 'zod';

export const createPatientSchema = z.object({
    firstName: z.string().min(2, 'Nombre obligatorio'),
    lastName: z.string().min(2, 'Apellido obligatorio'),
    dni: z.string().optional(),
    phone: z.string().min(9, 'Teléfono obligatorio'),
    email: z.string().email('Email inválido').optional(),
    dateOfBirth: z.string().datetime().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    medicalNotes: z.string().optional(),
    allergies: z.string().optional(),
    medications: z.string().optional(),
    bloodType: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const patientQuerySchema = z.object({
    search: z.string().optional(),
    active: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientQuery = z.infer<typeof patientQuerySchema>;
