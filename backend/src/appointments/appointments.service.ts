import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly prisma: PrismaService;
  private readonly notificationsService: NotificationsService;

  constructor(prisma: PrismaService, notificationsService: NotificationsService) {
    this.prisma = prisma;
    this.notificationsService = notificationsService;
  }

  async findUserAppointments(user: AuthUser) {
    const where =
      user.role === Role.ADMIN
        ? {}
        : user.role === Role.DOCTOR
          ? { doctor: { userId: user.id } }
          : { patientId: user.id };

    return this.prisma.appointment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true, documentId: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        specialty: { select: { id: true, name: true, color: true } },
        slot: { select: { id: true, startTime: true, endTime: true } },
      },
    });
  }

  async findOne(id: string, user: AuthUser) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
        doctor: { select: { id: true, firstName: true, lastName: true, userId: true } },
        specialty: { select: { id: true, name: true, color: true } },
        slot: { select: { id: true, startTime: true, endTime: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    const isOwner =
      appointment.patient.id === user.id ||
      user.role === Role.ADMIN ||
      (user.role === Role.DOCTOR && appointment.doctor.userId === user.id);
    if (!isOwner) {
      throw new ForbiddenException('No tienes acceso a este turno');
    }
    return appointment;
  }

  async create(userId: string, dto: CreateAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const slotRows = await tx.$queryRawUnsafe<Array<{ id: string; isBooked: boolean }>>(
        `SELECT id, "isBooked" FROM "Slot" WHERE id = $1 FOR UPDATE`,
        dto.slotId,
      );
      if (slotRows.length === 0) {
        throw new NotFoundException('El slot no existe');
      }
      if (slotRows[0].isBooked) {
        throw new ConflictException('Ese turno ya fue reservado');
      }

      const slot = await tx.slot.findUnique({
        where: { id: dto.slotId },
        include: { doctor: { include: { specialty: true } } },
      });
      if (!slot) {
        throw new NotFoundException('El slot no existe');
      }
      if (slot.startTime < new Date()) {
        throw new BadRequestException('No se puede reservar un turno en el pasado');
      }
      if (!slot.doctor.isActive) {
        throw new ConflictException('El médico no está disponible actualmente');
      }

      const appointment = await tx.appointment.create({
        data: {
          patientId: userId,
          doctorId: slot.doctorId,
          specialtyId: slot.doctor.specialtyId,
          slotId: slot.id,
          reason: dto.reason,
        },
      });

      await tx.slot.update({
        where: { id: slot.id },
        data: { isBooked: true, version: { increment: 1 } },
      });

      await this.notificationsService.enqueueAppointmentConfirmed(appointment.id);

      return tx.appointment.findUnique({
        where: { id: appointment.id },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
          specialty: { select: { id: true, name: true, color: true } },
          slot: { select: { id: true, startTime: true, endTime: true } },
        },
      });
    });
  }

  async cancel(id: string, user: AuthUser) {
    const canceled = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findUnique({
        where: { id },
        include: { slot: true, specialty: { select: { name: true } } },
      });
      if (!existing) {
        throw new NotFoundException('Turno no encontrado');
      }
      if (existing.patientId !== user.id && user.role !== Role.ADMIN) {
        throw new ForbiddenException('No tienes permiso para cancelar este turno');
      }
      if (existing.status === AppointmentStatus.CANCELLED) {
        throw new BadRequestException('El turno ya fue cancelado');
      }
      if (existing.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException('Este turno no se puede cancelar');
      }

      await tx.$queryRawUnsafe(
        `SELECT id FROM "Slot" WHERE id = $1 FOR UPDATE`,
        existing.slotId,
      );

      await tx.slot.update({
        where: { id: existing.slotId },
        data: { isBooked: false, version: { increment: 1 } },
      });

      const appointment = await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED, canceledAt: new Date() },
      });

      const specialtyName = existing.specialty
        ? existing.specialty.name
        : '';
      void this.notificationsService.enqueueAppointmentCancelled(id);
      void this.notificationsService.enqueueSlotAvailable(existing.doctorId, specialtyName);

      return appointment;
    });

    return this.prisma.appointment.findUnique({
      where: { id: canceled.id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        specialty: { select: { id: true, name: true, color: true } },
        slot: { select: { id: true, startTime: true, endTime: true } },
      },
    });
  }

  async getStats() {
    const [total, confirmed, cancelled, completed, today, upcoming] = await Promise.all([
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.CONFIRMED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.CANCELLED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
      this.prisma.appointment.count({
        where: { slot: { startTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
      }),
      this.prisma.appointment.count({ where: { slot: { startTime: { gte: new Date() } } } }),
    ]);

    const bySpecialtyRaw = await this.prisma.appointment.groupBy({
      by: ['specialtyId', 'status'],
      _count: { id: true },
    });
    const bySpecialty = await this.prisma.specialty.findMany({
      include: { _count: { select: { doctors: true } } },
    });

    const specialtiesMap = new Map(bySpecialty.map((s) => [s.id, s.name]));
    const grouped = new Map<string, { specialty: string; count: number }>();
    for (const row of bySpecialtyRaw) {
      const name = specialtiesMap.get(row.specialtyId) ?? row.specialtyId;
      const current = grouped.get(name) ?? { specialty: name, count: 0 };
      current.count += row._count.id;
      grouped.set(name, current);
    }

    const last7Days: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const start = new Date(day.setHours(0, 0, 0, 0));
      const end = new Date(new Date(day).setHours(23, 59, 59, 999));
      const count = await this.prisma.appointment.count({
        where: { slot: { startTime: { gte: start, lte: end } } },
      });
      last7Days.push({ date: start.toISOString().slice(0, 10), count });
    }

    return {
      total,
      confirmed,
      cancelled,
      completed,
      today,
      upcoming,
      bySpecialty: [...grouped.values()].sort((a, b) => b.count - a.count),
      last7Days,
    };
  }

  async adminList(query: ListAppointmentsQueryDto) {
    return this.prisma.appointment.findMany({
      where: query.status ? { status: query.status as AppointmentStatus } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, documentId: true, email: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        specialty: { select: { id: true, name: true, color: true } },
        slot: { select: { id: true, startTime: true, endTime: true } },
      },
    });
  }

  async joinWaitlist(userId: string, doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }
    const entry = await this.prisma.waitlistEntry.upsert({
      where: { patientId_doctorId: { patientId: userId, doctorId } },
      update: { status: 'WAITING', notifiedAt: null },
      create: { patientId: userId, doctorId, status: 'WAITING' },
    });
    return {
      entry,
      message: 'Estás en la lista de espera. Te avisaremos si se libera un turno.',
    };
  }
}