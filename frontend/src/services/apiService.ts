import type {
  Appointment,
  AppointmentStatus,
  AuthResponse,
  Doctor,
  QueueStats,
  Slot,
  Specialty,
  Stats,
  User,
  WaitlistEntry,
} from '../types';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3001/api';

const TOKEN_KEY = 'saludpublica_token';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    const stored = getToken();
    if (stored) {
      headers.Authorization = `Bearer ${stored}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      (data as { message?: string | string[] } | null)?.message ??
      `Error ${response.status}`;
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : message,
      response.status,
    );
  }

  return (await response.json()) as T;
}

export const api = {
  // Auth
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    documentId?: string;
  }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
      token: false,
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      token: false,
    }),

  getProfile: () => request<User>('/auth/profile'),

  // Specialties
  getSpecialties: () => request<Specialty[]>('/specialties', { token: false }),
  getSpecialty: (id: string) => request<Specialty & { doctors: Doctor[] }>(`/specialties/${id}`, { token: false }),

  // Doctors
  getDoctors: (specialtyId?: string) =>
    request<Doctor[]>(
      `/doctors${specialtyId ? `?specialtyId=${specialtyId}` : ''}`,
      { token: false },
    ),
  getDoctor: (id: string) => request<Doctor & { slots: Slot[] }>(`/doctors/${id}`, { token: false }),
  getAvailableSlots: (doctorId: string, date?: string) =>
    request<Slot[]>(
      `/doctors/${doctorId}/available-slots${date ? `?date=${date}` : ''}`,
      { token: false },
    ),

  // Appointments
  createAppointment: (payload: { slotId: string; reason?: string }) =>
    request<Appointment>('/appointments', { method: 'POST', body: payload }),
  getMyAppointments: () => request<Appointment[]>('/appointments'),
  cancelAppointment: (id: string) =>
    request<Appointment>(`/appointments/${id}`, { method: 'DELETE' }),
  joinWaitlist: (doctorId: string) =>
    request<{ message: string; entry: WaitlistEntry }>(
      `/appointments/waitlist/${doctorId}`,
      { method: 'POST' },
    ),
  getStats: () => request<Stats>('/appointments/stats'),
  getQueueStats: () => request<QueueStats>('/notifications/queue-stats'),

  // Public (token del email)
  getAppointmentByToken: (token: string) =>
    request<Appointment>(`/appointments-public/token/${token}`, { token: false }),
  cancelByToken: (token: string) =>
    request<Appointment>(`/appointments-public/cancel/${token}`, {
      method: 'POST',
      token: false,
    }),
};

export type AppointmentStatusFilter = AppointmentStatus | 'ALL';