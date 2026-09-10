import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, ListAppointmentsQueryDto } from './dto/create-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  private readonly appointmentsService: AppointmentsService;

  constructor(appointmentsService: AppointmentsService) {
    this.appointmentsService = appointmentsService;
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar turnos del usuario autenticado (ADMIN ve todos)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.findUserAppointments(user);
  }

  @Get('stats')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Estadísticas globales (ADMIN)' })
  stats() {
    return this.appointmentsService.getStats();
  }

  @Get('admin')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los turnos (ADMIN)' })
  adminList(@Query() query: ListAppointmentsQueryDto) {
    return this.appointmentsService.adminList(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un turno (dueño o ADMIN)' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.findOne(id, user);
  }

  @Roles(Role.PATIENT)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reservar turno (PATIENT) - transacción atómica' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar turno y liberar el slot (dueño o ADMIN)' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.cancel(id, user);
  }

  @Roles(Role.PATIENT)
  @Post('waitlist/:doctorId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unirse a lista de espera de un médico (PATIENT)' })
  joinWaitlist(@CurrentUser() user: AuthUser, @Param('doctorId') doctorId: string) {
    return this.appointmentsService.joinWaitlist(user.id, doctorId);
  }
}