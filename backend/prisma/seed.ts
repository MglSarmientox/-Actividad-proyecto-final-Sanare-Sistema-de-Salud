import 'dotenv/config';
import { Prisma, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SPECIALTIES = [
  { name: 'Medicina General', description: 'Consulta general y remisiones', color: '#0ea5e9' },
  { name: 'Pediatría', description: 'Atención de salud infantil', color: '#f59e0b' },
  { name: 'Ginecología', description: 'Salud de la mujer y maternidad', color: '#ec4899' },
  { name: 'Cardiología', description: 'Salud cardiovascular', color: '#ef4444' },
  { name: 'Dermatología', description: 'Salud de la piel', color: '#8b5cf6' },
];

const DOCTORS = [
  { firstName: 'Carlos', lastName: 'Rodríguez', specialty: 'Medicina General', email: 'dr.carlos@saludpublica.com', licenseNumber: 'MTR-1001' },
  { firstName: 'María', lastName: 'Fernández', specialty: 'Pediatría', email: 'dra.maria@saludpublica.com', licenseNumber: 'MTR-1002' },
  { firstName: 'Laura', lastName: 'Gómez', specialty: 'Ginecología', email: 'dra.laura@saludpublica.com', licenseNumber: 'MTR-1003' },
  { firstName: 'Jorge', lastName: 'Ramírez', specialty: 'Cardiología', email: 'dr.jorge@saludpublica.com', licenseNumber: 'MTR-1004' },
];

const SLOT_MINUTES = 20;
const START_HOUR = 8;
const END_HOUR = 17;
const GENERATE_DAYS = 7;
const WEEKDAYS = [1, 2, 3, 4, 5];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function generateSlotsFor(doctorId: string) {
  const slots: Array<Prisma.SlotCreateManyInput> = [];
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < GENERATE_DAYS; dayOffset++) {
    const current = new Date(startOfDay);
    current.setUTCDate(current.getUTCDate() + dayOffset);
    const jsDay = current.getUTCDay();
    const weekday = jsDay === 0 ? 7 : jsDay;

    if (!WEEKDAYS.includes(weekday)) {
      continue;
    }
    const isToday = dayOffset === 0;
    const startHourNow = isToday ? Math.max(START_HOUR, new Date().getUTCHours() + 1) : START_HOUR;

    for (let hour = startHourNow; hour < END_HOUR; hour++) {
      const slotStart = new Date(current);
      slotStart.setUTCHours(hour, 0, 0, 0);
      if (slotStart < new Date()) {
        continue;
      }
      const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60000);
      const dayEnd = new Date(slotStart);
      dayEnd.setUTCHours(END_HOUR, 0, 0, 0);
      if (slotEnd > dayEnd) {
        continue;
      }
      slots.push({
        doctorId,
        startTime: slotStart,
        endTime: slotEnd,
      });
    }
  }

  return slots;
}

async function main() {
  console.log('🌱 Poblando base de datos...');

  const adminPassword = await hashPassword('Admin123!');
  await prisma.user.upsert({
    where: { email: 'admin@saludpublica.com' },
    update: {},
    create: {
      email: 'admin@saludpublica.com',
      password: adminPassword,
      firstName: 'Administrador',
      lastName: 'del Sistema',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin creado (admin@saludpublica.com / Admin123!)');

  const specialtyMap = new Map<string, string>();
  for (const spec of SPECIALTIES) {
    const created = await prisma.specialty.upsert({
      where: { name: spec.name },
      update: { description: spec.description, color: spec.color },
      create: spec,
    });
    specialtyMap.set(spec.name, created.id);
  }
  console.log(`✅ ${SPECIALTIES.length} especialidades`);

  let totalSlots = 0;

  for (const doctorData of DOCTORS) {
    const password = await hashPassword('Doctor123!');
    const user = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {},
      create: {
        email: doctorData.email,
        password,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        role: Role.DOCTOR,
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        licenseNumber: doctorData.licenseNumber,
        specialtyId: specialtyMap.get(doctorData.specialty)!,
        consultationDays: JSON.stringify(WEEKDAYS),
      },
    });

    const slots = await generateSlotsFor(doctor.id);
    const result = await prisma.slot.createMany({
      data: slots,
      skipDuplicates: true,
    });
    totalSlots += result.count;
    console.log(`✅ ${doctor.firstName} ${doctor.lastName} -> ${result.count} slots`);
  }

  console.log(`✅ Total de slots generados: ${totalSlots}`);
  console.log('🎉 Seed completado');
}

main()
  .catch((error) => {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });