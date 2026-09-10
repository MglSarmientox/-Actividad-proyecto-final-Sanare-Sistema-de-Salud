import { useEffect, useState } from 'react';
import {
  Activity,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert } from '../components/ui/Alert';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Field';
import { Spinner } from '../components/ui/Spinner';
import { api, ApiError } from '../services/apiService';
import type { Appointment, AppointmentStatus, QueueStats, Stats } from '../types';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-sky-100 text-sky-800',
  NO_SHOW: 'bg-ink-100 text-ink-600',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
  NO_SHOW: 'No asistió',
};

const PIE_COLORS = ['#0d9488', '#f59e0b', '#ec4899', '#ef4444', '#8b5cf6', '#0ea5e9'];

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'danger' | 'info';
}) {
  const tones = {
    default: 'text-ink-700 bg-ink-100',
    success: 'text-green-700 bg-green-100',
    danger: 'text-red-700 bg-red-100',
    info: 'text-sky-700 bg-sky-100',
  };
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${tones[tone]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </article>
  );
}

function QueueStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4">
      <Icon className="size-5 text-primary-600" aria-hidden="true" />
      <div>
        <p className="text-2xl font-bold text-ink-900">{value}</p>
        <p className="text-xs text-ink-500">{label}</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getStats(), api.getQueueStats(), api.getMyAppointments()])
      .then(([statsData, queueData, appointmentsData]) => {
        setStats(statsData);
        setQueueStats(queueData);
        setAppointments(appointmentsData);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las estadísticas'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Spinner label="Cargando panel…" />
      </section>
    );
  }

  const shortLabels: Record<string, string> = {};
  for (const day of stats?.last7Days ?? []) {
    const date = new Date(`${day.date}T12:00:00Z`);
    shortLabels[day.date] = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  const chartData =
    stats?.last7Days.map((day) => ({ name: shortLabels[day.date] ?? day.date, count: day.count })) ?? [];

  const filtered =
    filter === 'ALL'
      ? appointments
      : appointments.filter((appointment) => appointment.status === filter);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Panel de administración"
        description="Métricas, disponibilidad y turnos del centro de salud."
      />

      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      {stats ? (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard icon={CalendarCheck2} label="Turnos totales" value={stats.total} />
            <StatCard icon={CheckCircle2} label="Confirmados" value={stats.confirmed} tone="success" />
            <StatCard icon={XCircle} label="Cancelados" value={stats.cancelled} tone="danger" />
            <StatCard icon={Inbox} label="Completados" value={stats.completed} tone="info" />
            <StatCard icon={Clock} label="Hoy" value={stats.today} />
            <StatCard icon={Activity} label="Próximos" value={stats.upcoming} />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="font-semibold text-ink-900">Turnos por especialidad</h2>
              <div className="mt-4 h-64">
                {stats.bySpecialty.length === 0 ? (
                  <p className="text-sm text-ink-400">Sin turnos registrados.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.bySpecialty}
                        dataKey="count"
                        nameKey="specialty"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {stats.bySpecialty.map((entry, index) => (
                          <Cell
                            key={entry.specialty}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="font-semibold text-ink-900">Turnos en los últimos 7 días</h2>
              <div className="mt-4 h-64">
                {chartData.length === 0 ? (
                  <p className="text-sm text-ink-400">Sin datos suficientes.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Turnos" fill="#0d9488" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <QueueStatCard icon={Mail} label="Emails enviados" value={queueStats?.completed ?? 0} />
            <QueueStatCard icon={Clock} label="En espera" value={queueStats?.waiting ?? 0} />
            <QueueStatCard icon={Activity} label="Procesando" value={queueStats?.active ?? 0} />
            <QueueStatCard icon={Clock} label="Diferidos" value={queueStats?.delayed ?? 0} />
            <QueueStatCard icon={XCircle} label="Fallidos" value={queueStats?.failed ?? 0} />
          </section>
        </>
      ) : null}

      <section className="mt-8" aria-labelledby="tabla-turnos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="tabla-turnos" className="text-lg font-semibold text-ink-900">
            Turnos del sistema
          </h2>
          <div className="w-52">
            <label htmlFor="status-filter" className="sr-only">
              Filtrar por estado
            </label>
            <Select
              id="status-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as AppointmentStatus | 'ALL')}
            >
              <option value="ALL">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <th scope="col" className="px-5 py-3">Paciente</th>
                <th scope="col" className="px-5 py-3">Especialidad / Médico</th>
                <th scope="col" className="px-5 py-3">Fecha</th>
                <th scope="col" className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-ink-400">
                    No hay turnos que mostrar.
                  </td>
                </tr>
              ) : (
                filtered.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-ink-100 last:border-0">
                    <td className="px-5 py-3">
                      {appointment.patient
                        ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-800">{appointment.specialty.name}</p>
                      <p className="text-xs text-ink-500">
                        {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <time dateTime={appointment.slot.startTime}>
                        {DATE_FORMATTER.format(new Date(appointment.slot.startTime))}
                      </time>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[appointment.status]}`}
                      >
                        {STATUS_LABELS[appointment.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}