import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../common/prisma/prisma.service';

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  appointmentId?: string;
  type: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly prisma: PrismaService;
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(configService: ConfigService, prisma: PrismaService) {
    this.prisma = prisma;
    this.enabled = Boolean(configService.get<string>('EMAIL_USER'));
    this.from = configService.get<string>('EMAIL_FROM', 'SaludPública Connect');

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: configService.get<string>('EMAIL_HOST', 'smtp.gmail.com'),
        port: Number(configService.get<string>('EMAIL_PORT', '587')),
        secure: false,
        auth: {
          user: configService.get<string>('EMAIL_USER')!,
          pass: configService.get<string>('EMAIL_PASS', ''),
        },
      });
    } else {
      this.transporter = null;
    }
  }

  async send(params: SendEmailParams): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[EMAIL MODE DEV] ${params.type} -> ${params.to}: ${params.subject}`);
      await this.record(params, true);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      await this.record(params, true);
      this.logger.log(`Email enviado a ${params.to} (${params.type})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Fallo al enviar email a ${params.to}: ${message}`);
      await this.record(params, false, message);
    }
  }

  private async record(params: SendEmailParams, delivered: boolean, error?: string) {
    try {
      await this.prisma.notification.create({
        data: {
          appointmentId: params.appointmentId ?? null,
          type: params.type,
          channel: 'EMAIL',
          recipient: params.to,
          subject: params.subject,
          body: params.html,
          deliveredAt: delivered ? new Date() : null,
          sentAt: new Date(),
          error,
        },
      });
    } catch (recordError) {
      this.logger.error(`No se pudo persistir notificación: ${recordError}`);
    }
  }
}