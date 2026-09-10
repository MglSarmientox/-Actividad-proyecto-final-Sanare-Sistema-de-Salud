import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly notificationsService: NotificationsService;

  constructor(notificationsService: NotificationsService) {
    this.notificationsService = notificationsService;
  }

  @Roles(Role.ADMIN)
  @Get('queue-stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado de la cola Bull (ADMIN)' })
  queueStats() {
    return this.notificationsService.getJobStats();
  }
}