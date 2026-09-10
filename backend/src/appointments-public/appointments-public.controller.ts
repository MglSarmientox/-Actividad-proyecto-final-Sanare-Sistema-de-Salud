import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AppointmentsPublicService } from './appointments-public.service';

@ApiTags('appointments-public')
@Public()
@Controller('appointments-public')
export class AppointmentsPublicController {
  private readonly appointmentsPublicService: AppointmentsPublicService;

  constructor(appointmentsPublicService: AppointmentsPublicService) {
    this.appointmentsPublicService = appointmentsPublicService;
  }

  @Get('token/:token')
  @ApiParam({ name: 'token', description: 'Token del turno (viene en el email)' })
  @ApiOperation({ summary: 'Ver turno público por token (sin autenticación)' })
  getByToken(@Param('token') token: string) {
    return this.appointmentsPublicService.getByToken(token);
  }

  @Post('cancel/:token')
  @ApiParam({ name: 'token', description: 'Token del turno (viene en el email)' })
  @ApiOperation({ summary: 'Cancelar turno público por token (sin autenticación)' })
  cancelByToken(@Param('token') token: string) {
    return this.appointmentsPublicService.cancelByToken(token);
  }
}