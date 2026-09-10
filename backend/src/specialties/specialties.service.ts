import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async findAll() {
    return this.prisma.specialty.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        _count: { select: { doctors: true } },
      },
    });
  }

  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
      include: {
        doctors: {
          where: { isActive: true },
          orderBy: { lastName: 'asc' },
          include: {
            _count: { select: { slots: true } },
          },
        },
      },
    });
    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }
    return specialty;
  }

  async create(dto: CreateSpecialtyDto) {
    const existing = await this.prisma.specialty.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Ya existe una especialidad con ese nombre');
    }
    return this.prisma.specialty.create({ data: dto });
  }

  async update(id: string, dto: UpdateSpecialtyDto) {
    const existing = await this.prisma.specialty.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Especialidad no encontrada');
    }
    if (dto.name) {
      const clash = await this.prisma.specialty.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (clash) {
        throw new ConflictException('Ya existe una especialidad con ese nombre');
      }
    }
    return this.prisma.specialty.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await this.prisma.specialty.findUnique({
      where: { id },
      include: { _count: { select: { doctors: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Especialidad no encontrada');
    }
    if (existing._count.doctors > 0) {
      throw new ConflictException(
        'No se puede eliminar: la especialidad tiene médicos asignados',
      );
    }
    return this.prisma.specialty.delete({ where: { id } });
  }
}