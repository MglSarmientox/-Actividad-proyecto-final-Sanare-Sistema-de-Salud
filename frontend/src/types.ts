export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type AppointmentStatus =
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  documentId?: string | null;
  role: Role;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type Specialty = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  _count?: { doctors: number };
};

export type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string | null;
  isActive: boolean;
  specialty: { id: string; name: string; color?: string | null };
  _count?: { slots?: number };
  user?: { id: string; email: string; role: Role } | null;
};

export type Slot = {
  id: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  version: number;
  appointment?: {
    id: string;
    status: AppointmentStatus;
    patient: { firstName: string; lastName: string };
  } | null;
};

export type Appointment = {
  id: string;
  token: string;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    documentId?: string | null;
  };
  doctor: { id: string; firstName: string; lastName: string };
  specialty: { id: string; name: string; color?: string | null };
  slot: { id: string; startTime: string; endTime: string };
};

export type Stats = {
  total: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  today: number;
  upcoming: number;
  bySpecialty: Array<{ specialty: string; count: number }>;
  last7Days: Array<{ date: string; count: number }>;
};

export type QueueStats = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

export type WaitlistEntry = {
  id: string;
  patientId: string;
  doctorId: string;
  status: string;
  notifiedAt?: string | null;
  createdAt: string;
};