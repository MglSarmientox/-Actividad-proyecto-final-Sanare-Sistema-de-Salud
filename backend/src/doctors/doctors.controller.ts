import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  private readonly doctorsService: DoctorsService;

  constructor(doctorsService: DoctorsService) {
    this.doctorsService = doctorsService;
  }

  @Public()
  @Get()
  @ApiQuery({ name: 'specialtyId', required: false, description: 'Filtrar por especialidad' })
  @ApiOperation({ summary: 'Listar médicos activos (opcional filtro por especialidad)' })
  findAll(@Query('specialtyId') specialtyId?: string) {
    return this.doctorsService.findAll(specialtyId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener médico con sus próximos slots' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Public()
  @Get(':id/available-slots')
  @ApiQuery({ name: 'date', required: false, example: '2026-09-15', description: 'Fecha YYYY-MM-DD' })
  @ApiOperation({ summary: 'Slots disponibles de un médico (por fecha o todos los próximos)' })
  availableSlots(
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    return this.doctorsService.getAvailableSlots(id, date);
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear médico (ADMIN). Opcionalmente crea su cuenta DOCTOR' })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar médico (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar/desactivar médico (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/slots')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear slot manualmente (ADMIN)' })
  createSlot(@Param('id') id: string, @Body() dto: CreateSlotDto) {
    return this.doctorsService.createSlot(id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/slots/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar slots automáticamente (ADMIN)' })
  generateSlots(@Param('id') id: string, @Body() dto: GenerateSlotsDto) {
    return this.doctorsService.generateSlots(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/slots')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar todos los slots de un médico (ADMIN)' })
  deleteAllSlots(@Param('id') id: string) {
    return this.doctorsService.deleteAllSlots(id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/slots/duplicates')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar slots duplicados de un médico (ADMIN)' })
  deleteDuplicates(@Param('id') id: string) {
    return this.doctorsService.deleteDuplicates(id);
  }
}