// ─── Appointments Service (Scaffold) ────────────────────
import prisma from '../../config/database.js';
import type { CreateAppointmentInput, UpdateAppointmentInput } from './appointments.schemas.js';

export class AppointmentsService {
    static async findAll(query: { date?: string; from?: string; to?: string; doctorId?: string; operatoryId?: string; status?: string; page?: string; limit?: string }) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '50');
        const skip = (page - 1) * limit;
        const where: any = {};

        if (query.doctorId) where.doctorId = query.doctorId;
        if (query.operatoryId) where.operatoryId = query.operatoryId;
        if (query.status) where.status = query.status;
        if (query.date) {
            const d = new Date(query.date);
            where.startTime = { gte: d, lt: new Date(d.getTime() + 86400000) };
        } else if (query.from && query.to) {
            where.startTime = { gte: new Date(query.from), lte: new Date(query.to) };
        }

        const [data, total] = await Promise.all([
            prisma.appointment.findMany({ where, skip, take: limit, orderBy: { startTime: 'asc' }, include: { patient: true, doctor: true, operatory: true } }),
            prisma.appointment.count({ where }),
        ]);

        return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async findById(id: string) {
        const appointment = await prisma.appointment.findUnique({ where: { id }, include: { patient: true, doctor: true, operatory: true } });
        if (!appointment) throw new Error('Cita no encontrada');
        return appointment;
    }

    static async create(input: CreateAppointmentInput) {
        return prisma.appointment.create({ data: input, include: { patient: true, doctor: true, operatory: true } });
    }

    static async update(id: string, input: UpdateAppointmentInput) {
        return prisma.appointment.update({ where: { id }, data: input, include: { patient: true, doctor: true, operatory: true } });
    }

    static async cancel(id: string) {
        return prisma.appointment.update({ where: { id }, data: { status: 'cancelled' } });
    }
}
