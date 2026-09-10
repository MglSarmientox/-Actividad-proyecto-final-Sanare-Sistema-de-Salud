import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsPublicService {
  private readonly prisma: PrismaService;
  private readonly notificationsService: NotificationsService;

  constructor(prisma: PrismaService, notificationsService: NotificationsService) {
    this.prisma = prisma;
    this.notificationsService = notificationsService;
  }

  async getByToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { token },
      include: {
        patient: { select: { firstName: true, lastName: true, documentId: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        specialty: { select: { id: true, name: true, color: true } },
        slot: { select: { id: true, startTime: true, endTime: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }
    return appointment;
  }

  async cancelByToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { token },
      include: { slot: true, specialty: { select: { name: true } } },
    });
    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Este turno no se puede cancelar');
    }
    if (appointment.slot.startTime < new Date()) {
      throw new BadRequestException('El turno ya pasó, no se puede cancelar');
    }

    const canceled = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        `SELECT id FROM "Slot" WHERE id = $1 FOR UPDATE`,
        appointment.slotId,
      );
      await tx.slot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false, version: { increment: 1 } },
      });
      return tx.appointment.update({
        where: { id: appointment.id },
        data: { status: AppointmentStatus.CANCELLED, canceledAt: new Date() },
      });
    });

    void this.notificationsService.enqueueAppointmentCancelled(canceled.id);
    void this.notificationsService.enqueueSlotAvailable(
      canceled.doctorId,
      appointment.specialty.name,
    );

    return this.getByToken(token);
  }
}