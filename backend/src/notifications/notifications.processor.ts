import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from './email.service';
import {
  appointmentConfirmedEmail,
  appointmentReminderEmail,
  appointmentCancelledEmail,
  slotAvailableEmail,
  welcomeEmail,
} from './email.templates';
import { NOTIFICATIONS_QUEUE, NOTIFICATION_JOB } from './constants';

type JobData =
  | { appointmentId: string }
  | { userEmail: string; firstName: string }
  | {
      patientId: string;
      patientEmail: string;
      patientName: string;
      doctorName: string;
      specialtyName: string;
      reloadUrl: string;
    };

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly prisma: PrismaService;
  private readonly emailService: EmailService;

  constructor(prisma: PrismaService, emailService: EmailService) {
    this.prisma = prisma;
    this.emailService = emailService;
  }

  @Process()
  async handle(job: Job<JobData>): Promise<void> {
    switch (job.name) {
      case NOTIFICATION_JOB.WELCOME:
        await this.handleWelcome(job.data as { userEmail: string; firstName: string });
        break;
      case NOTIFICATION_JOB.APPOINTMENT_CONFIRMED:
        await this.handleAppointmentConfirmed(job.data as { appointmentId: string });
        break;
      case NOTIFICATION_JOB.APPOINTMENT_REMINDER:
        await this.handleAppointmentReminder(job.data as { appointmentId: string });
        break;
      case NOTIFICATION_JOB.APPOINTMENT_CANCELLED:
        await this.handleAppointmentCancelled(job.data as { appointmentId: string });
        break;
      case NOTIFICATION_JOB.SLOT_AVAILABLE:
        await this.handleSlotAvailable(job.data);
        break;
      default:
        this.logger.warn(`Tipo de job desconocido: ${job.name}`);
    }
  }

  private async loadAppointment(appointmentId: string) {
    return this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { firstName: true, lastName: true } },
        specialty: { select: { name: true } },
        slot: { select: { startTime: true } },
      },
    });
  }

  private async handleWelcome({ userEmail, firstName }: { userEmail: string; firstName: string }) {
    await this.emailService.send({
      to: userEmail,
      subject: 'Bienvenido a SaludPública Sanare',
      type: NOTIFICATION_JOB.WELCOME,
      html: welcomeEmail(firstName),
    });
  }

  private async handleAppointmentConfirmed({ appointmentId }: { appointmentId: string }) {
    const appointment = await this.loadAppointment(appointmentId);
    if (!appointment) return;

    const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
    const doctorName = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
    const cancelUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/turno/${appointment.token}`;

    await this.emailService.send({
      to: appointment.patient.email,
      subject: 'Turno confirmado · SaludPública Sanare',
      type: NOTIFICATION_JOB.APPOINTMENT_CONFIRMED,
      appointmentId,
      html: appointmentConfirmedEmail(
        {
          patientName,
          doctorName,
          specialty: appointment.specialty.name,
          dateTime: this.formatDateTime(appointment.slot.startTime),
        },
        cancelUrl,
      ),
    });
  }

  private async handleAppointmentReminder({ appointmentId }: { appointmentId: string }) {
    const appointment = await this.loadAppointment(appointmentId);
    if (!appointment || appointment.status !== AppointmentStatus.CONFIRMED) return;

    await this.emailService.send({
      to: appointment.patient.email,
      subject: 'Recordatorio de turno · SaludPública Sanare',
      type: NOTIFICATION_JOB.APPOINTMENT_REMINDER,
      appointmentId,
      html: appointmentReminderEmail({
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        specialty: appointment.specialty.name,
        dateTime: this.formatDateTime(appointment.slot.startTime),
      }),
    });
  }

  private async handleAppointmentCancelled({ appointmentId }: { appointmentId: string }) {
    const appointment = await this.loadAppointment(appointmentId);
    if (!appointment || appointment.status !== AppointmentStatus.CANCELLED) return;

    await this.emailService.send({
      to: appointment.patient.email,
      subject: 'Turno cancelado · SaludPública Sanare',
      type: NOTIFICATION_JOB.APPOINTMENT_CANCELLED,
      appointmentId,
      html: appointmentCancelledEmail({
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        specialty: appointment.specialty.name,
        dateTime: this.formatDateTime(appointment.slot.startTime),
      }),
    });
  }

  private async handleSlotAvailable(data: JobData) {
    if (!('patientEmail' in data)) return;

    await this.emailService.send({
      to: data.patientEmail,
      subject: '¡Turno disponible! · SaludPública Sanare',
      type: NOTIFICATION_JOB.SLOT_AVAILABLE,
      html: slotAvailableEmail(
        data.patientName,
        data.doctorName,
        data.specialtyName,
        data.reloadUrl,
      ),
    });
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  }
}