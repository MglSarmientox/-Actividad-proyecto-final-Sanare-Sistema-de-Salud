import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarX2 } from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { api, ApiError } from '../services/apiService';
import type { Appointment, AppointmentStatus } from '../types';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'short',
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

function canCancel(appointment: Appointment): boolean {
  return (
    appointment.status === 'CONFIRMED' &&
    new Date(appointment.slot.startTime).getTime() > Date.now()
  );
}

export function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getMyAppointments()
      .then(setAppointments)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los turnos'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    setError(null);
    try {
      await api.cancelAppointment(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cancelar el turno');
    } finally {
      setCancellingId(null);
    }
  };

  const active = appointments.filter((a) => a.status === 'CONFIRMED');
  const past = appointments.filter((a) => a.status !== 'CONFIRMED');

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Mis turnos"
        description="Consulta y gestiona tus citas médicas."
      />

      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      {loading ? (
        <div className="mt-8"><Spinner label="Cargando turnos…" /></div>
      ) : appointments.length === 0 ? (
        <article className="mt-8 rounded-2xl border border-ink-200 bg-white p-10 text-center">
          <CalendarX2 className="mx-auto size-10 text-ink-300" aria-hidden="true" />
          <h2 className="mt-4 font-semibold text-ink-800">Aún no tienes turnos</h2>
          <p className="mt-1 text-sm text-ink-500">
            Reserva tu primera cita médica ahora.
          </p>
          <Link
            to="/reservar"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700"
          >
            Reservar turno
          </Link>
        </article>
      ) : (
        <>
          <section className="mt-8" aria-labelledby="turnos-activos">
            <h2 id="turnos-activos" className="text-lg font-semibold text-ink-900">
              Próximos ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="mt-2 text-sm text-ink-500">No tienes turnos próximos.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {active.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex flex-col gap-4 rounded-2xl border border-ink-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-ink-900">
                        {appointment.specialty.name}
                      </p>
                      <p className="text-sm text-ink-500">
                        {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </p>
                      <time className="block text-sm font-medium text-primary-700" dateTime={appointment.slot.startTime}>
                        {DATE_FORMATTER.format(new Date(appointment.slot.startTime))}
                      </time>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[appointment.status]}`}>
                        {STATUS_LABELS[appointment.status]}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        to={`/turno/${appointment.token}`}
                        className="inline-flex items-center rounded-lg border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                      >
                        Detalle
                      </Link>
                      {canCancel(appointment) ? (
                        <Button
                          variant="danger"
                          size="md"
                          loading={cancellingId === appointment.id}
                          onClick={() => handleCancel(appointment.id)}
                        >
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 ? (
            <section className="mt-10" aria-labelledby="turnos-pasados">
              <h2 id="turnos-pasados" className="text-lg font-semibold text-ink-900">
                Historial ({past.length})
              </h2>
              <ul className="mt-4 space-y-2">
                {past.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white px-5 py-3 opacity-80"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-800">
                        {appointment.specialty.name}
                      </p>
                      <p className="text-xs text-ink-500">
                        {DATE_FORMATTER.format(new Date(appointment.slot.startTime))}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[appointment.status]}`}>
                      {STATUS_LABELS[appointment.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}