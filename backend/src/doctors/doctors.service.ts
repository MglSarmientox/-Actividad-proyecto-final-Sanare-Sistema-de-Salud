import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, Slot } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async findAll(specialtyId?: string) {
    return this.prisma.doctor.findMany({
      where: {
        isActive: true,
        ...(specialtyId ? { specialtyId } : {}),
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        specialty: { select: { id: true, name: true, color: true } },
        _count: {
          select: {
            slots: {
              where: { isBooked: false, startTime: { gte: new Date() } },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        specialty: { select: { id: true, name: true, color: true } },
        slots: {
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 200,
          include: {
            appointment: {
              select: {
                id: true,
                status: true,
                patient: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }
    return doctor;
  }

  async create(dto: CreateDoctorDto) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
    });
    if (!specialty) {
      throw new NotFoundException('La especialidad indicada no existe');
    }

    let userId: string | null = null;

    if (dto.email) {
      const password = dto.password ?? 'Doctor' + Math.random().toString(36).slice(-8) + '1A';
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
      const salt = await bcrypt.genSalt(10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: await bcrypt.hash(password, salt),
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: Role.DOCTOR,
        },
      });
      userId = user.id;
    }

    return this.prisma.doctor.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        specialtyId: dto.specialtyId,
        licenseNumber: dto.licenseNumber,
        consultationDays: dto.consultationDays ?? [1, 2, 3, 4, 5],
        userId,
      },
      include: {
        specialty: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }
    if (dto.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: dto.specialtyId },
      });
      if (!specialty) {
        throw new NotFoundException('La especialidad indicada no existe');
      }
    }
    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.specialtyId !== undefined && { specialtyId: dto.specialtyId }),
        ...(dto.licenseNumber !== undefined && { licenseNumber: dto.licenseNumber }),
        ...(dto.consultationDays !== undefined && {
          consultationDays: dto.consultationDays,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        specialty: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
            slots: { where: { isBooked: true } },
          },
        },
      },
    });
    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }
    if (doctor._count.appointments > 0 || doctor._count.slots > 0) {
      await this.prisma.doctor.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Médico desactivado (tiene turnos/slots vinculados)' };
    }
    await this.prisma.doctor.delete({ where: { id } });
    return { message: 'Médico eliminado' };
  }

  async getAvailableSlots(doctorId: string, date?: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    const where = {
      doctorId,
      isBooked: false,
      startTime: { gte: new Date() },
      ...(date
        ? {
            startTime: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lt: new Date(`${date}T23:59:59.999Z`),
            },
          }
        : {}),
    };

    const slots = await this.prisma.slot.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
    return slots;
  }

  async createSlot(doctorId: string, dto: CreateSlotDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }
    if (endTime <= startTime) {
      throw new BadRequestException('endTime debe ser posterior a startTime');
    }
    if (startTime < new Date()) {
      throw new BadRequestException('No se pueden crear slots en el pasado');
    }

    const overlap = await this.prisma.slot.findFirst({
      where: {
        doctorId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (overlap) {
      throw new ConflictException('El slot se solapa con un turno existente');
    }

    return this.prisma.slot.create({
      data: {
        doctorId,
        startTime,
        endTime,
        isBooked: dto.isBooked ?? false,
      },
    });
  }

  async generateSlots(doctorId: string, dto: GenerateSlotsDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    const weekdays = dto.weekdays ?? [1, 2, 3, 4, 5];
    const durationMs = dto.slotDurationMinutes * 60000;
    const slotsToCreate: Array<{ doctorId: string; startTime: Date; endTime: Date }> = [];

    const startOfDay = dto.daysFrom
      ? new Date(`${dto.daysFrom}T00:00:00.000Z`)
      : new Date(new Date().setUTCHours(0, 0, 0, 0));

    for (let day = 0; day < dto.days; day++) {
      const current = new Date(startOfDay);
      current.setUTCDate(current.getUTCDate() + day);
      const jsDay = current.getUTCDay();
      const weekday = jsDay === 0 ? 7 : jsDay;
      if (!weekdays.includes(weekday)) {
        continue;
      }
      for (let hour = dto.startHour; hour < dto.endHour; hour++) {
        const slotStart = new Date(current);
        slotStart.setUTCHours(hour, 0, 0, 0);
        if (slotStart < new Date()) {
          continue;
        }
        const slotEnd = new Date(slotStart.getTime() + durationMs);
        if (slotEnd > new Date(new Date(slotStart).setUTCHours(dto.endHour, 0, 0, 0))) {
          continue;
        }
        slotsToCreate.push({
          doctorId,
          startTime: slotStart,
          endTime: slotEnd,
        });
      }
    }

    if (slotsToCreate.length === 0) {
      return { created: 0, message: 'No se generaron slots para el rango indicado' };
    }

    const result = await this.prisma.slot.createMany({
      data: slotsToCreate,
      skipDuplicates: true,
    });

    return {
      created: result.count,
      target: slotsToCreate.length,
      message: `Se crearon ${result.count} slots nuevos`,
    };
  }

  async deleteAllSlots(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }
    const booked = await this.prisma.slot.count({
      where: { doctorId, isBooked: true },
    });
    if (booked > 0) {
      throw new ConflictException(
        `No se pueden eliminar: existen ${booked} slots con turnos reservados`,
      );
    }
    const { count } = await this.prisma.slot.deleteMany({
      where: { doctorId },
    });
    return { deleted: count };
  }

  async deleteDuplicates(doctorId: string) {
    const slots = await this.prisma.slot.findMany({
      where: { doctorId },
      orderBy: { startTime: 'asc' },
    });

    const seen = new Map<string, Slot>();
    const toDelete: string[] = [];

    for (const slot of slots) {
      const key = `${slot.doctorId}_${slot.startTime.toISOString()}`;
      if (seen.has(key)) {
        toDelete.push(slot.id);
      } else {
        seen.set(key, slot);
      }
    }

    if (toDelete.length > 0) {
      await this.prisma.slot.deleteMany({ where: { id: { in: toDelete } } });
    }

    return { duplicatesRemoved: toDelete.length };
  }
}