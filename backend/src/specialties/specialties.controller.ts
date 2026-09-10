import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { SpecialtiesService } from './specialties.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('specialties')
@Controller('specialties')
export class SpecialtiesController {
  private readonly specialtiesService: SpecialtiesService;

  constructor(specialtiesService: SpecialtiesService) {
    this.specialtiesService = specialtiesService;
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todas las especialidades' })
  findAll() {
    return this.specialtiesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID de la especialidad' })
  @ApiOperation({ summary: 'Obtener especialidad con sus médicos activos' })
  findOne(@Param('id') id: string) {
    return this.specialtiesService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear especialidad (ADMIN)' })
  create(@Body() dto: CreateSpecialtyDto) {
    return this.specialtiesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar especialidad (ADMIN)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSpecialtyDto,
  ) {
    return this.specialtiesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar especialidad (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}