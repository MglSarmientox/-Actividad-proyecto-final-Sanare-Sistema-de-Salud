import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsPublicController } from './appointments-public.controller';
import { AppointmentsPublicService } from './appointments-public.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AppointmentsPublicController],
  providers: [AppointmentsPublicService],
})
export class AppointmentsPublicModule {}