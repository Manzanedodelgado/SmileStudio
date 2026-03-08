// ─── Patients Service (Scaffold) ────────────────────────
import prisma from '../../config/database.js';
import type { CreatePatientInput, UpdatePatientInput } from './patients.schemas.js';

export class PatientsService {
    static async findAll(query: { search?: string; active?: string; page?: string; limit?: string }) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '20');
        const skip = (page - 1) * limit;
        const where: any = {};

        if (query.active !== undefined) where.active = query.active === 'true';
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { dni: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.patient.findMany({ where, skip, take: limit, orderBy: { lastName: 'asc' } }),
            prisma.patient.count({ where }),
        ]);

        return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async findById(id: string) {
        const patient = await prisma.patient.findUnique({ where: { id }, include: { appointments: true } });
        if (!patient) throw new Error('Paciente no encontrado');
        return patient;
    }

    static async create(input: CreatePatientInput) {
        return prisma.patient.create({ data: input });
    }

    static async update(id: string, input: UpdatePatientInput) {
        return prisma.patient.update({ where: { id }, data: input });
    }

    static async delete(id: string) {
        return prisma.patient.update({ where: { id }, data: { active: false } });
    }
}
