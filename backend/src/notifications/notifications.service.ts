import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus } from '@prisma/client';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { NOTIFICATIONS_QUEUE, NOTIFICATION_JOB } from './constants';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly prisma: PrismaService;
  private readonly notificationsQueue: Queue;

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) notificationsQueue: Queue,
    prisma: PrismaService,
  ) {
    this.notificationsQueue = notificationsQueue;
    this.prisma = prisma;
  }

  async enqueueWelcome(userEmail: string, firstName: string): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATION_JOB.WELCOME,
      { userEmail, firstName },
      { attempts: 2, backoff: { type: 'exponential', delay: 3000 } },
    );
  }

  async enqueueAppointmentConfirmed(appointmentId: string): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATION_JOB.APPOINTMENT_CONFIRMED,
      { appointmentId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 500 },
    );
  }

  async enqueueAppointmentCancelled(appointmentId: string): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATION_JOB.APPOINTMENT_CANCELLED,
      { appointmentId },
      { attempts: 2, backoff: { type: 'exponential', delay: 3000 } },
    );
  }

  async enqueueSlotAvailable(doctorId: string, specialtyName: string): Promise<void> {
    const waiting = await this.prisma.waitlistEntry.findMany({
      where: { doctorId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      take: 3,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (waiting.length === 0) {
      return;
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { firstName: true, lastName: true },
    });
    if (!doctor) {
      return;
    }

    for (const entry of waiting) {
      await this.notificationsQueue.add(
        NOTIFICATION_JOB.SLOT_AVAILABLE,
        {
          patientId: entry.patient.id,
          patientEmail: entry.patient.email,
          patientName: `${entry.patient.firstName} ${entry.patient.lastName}`,
          doctorId,
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
          specialtyName,
          reloadUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reservar`,
        },
        { attempts: 2, backoff: { type: 'exponential', delay: 3000 } },
      );
    }

    await this.prisma.waitlistEntry.updateMany({
      where: { id: { in: waiting.map((w) => w.id) } },
      data: { status: 'NOTIFIED', notifiedAt: new Date() },
    });

    this.logger.log(`Notificación de slot disponible encolada para ${waiting.length} paciente(s)`);
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'appointment-reminders' })
  async scheduleReminders(): Promise<void> {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        slot: { startTime: { gte: in15Minutes, lte: in24Hours } },
        reminderSentAt: null,
      },
      select: { id: true },
      take: 100,
    });

    for (const appointment of upcoming) {
      await this.enqueueReminder(appointment.id);
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });
    }

    if (upcoming.length > 0) {
      this.logger.log(`Cron: ${upcoming.length} recordatorios encolados`);
    }
  }

  private async enqueueReminder(appointmentId: string): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATION_JOB.APPOINTMENT_REMINDER,
      { appointmentId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }

  async getJobStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.notificationsQueue.getWaitingCount(),
      this.notificationsQueue.getActiveCount(),
      this.notificationsQueue.getCompletedCount(),
      this.notificationsQueue.getFailedCount(),
      this.notificationsQueue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }
}