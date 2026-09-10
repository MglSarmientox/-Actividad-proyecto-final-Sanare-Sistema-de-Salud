import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarX2, CheckCircle2, Hospital } from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { api, ApiError } from '../services/apiService';
import type { Appointment } from '../types';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export function TurnoPublic() {
  const { token } = useParams<{ token: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    api
      .getAppointmentByToken(token)
      .then(setAppointment)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el turno'),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!token) {
      return;
    }
    if (!window.confirm('¿Seguro que deseas cancelar este turno?')) {
      return;
    }
    setCancelling(true);
    setError(null);
    try {
      const updated = await api.cancelByToken(token);
      setAppointment(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cancelar el turno');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <PageHeader title="Estado de tu turno" />

      {loading ? (
        <div className="mt-8"><Spinner label="Consultando turno…" /></div>
      ) : error ? (
        <div className="mt-6 space-y-4">
          <Alert tone="error">{error}</Alert>
          <Link to="/" className="inline-block text-sm font-medium text-primary-700 hover:underline">
            Volver al inicio
          </Link>
        </div>
      ) : appointment ? (
        <article className="mt-8 space-y-5 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
          <header className="text-center">
            <Hospital className="mx-auto size-10 text-primary-600" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-bold text-ink-900">
              {appointment.specialty.name}
            </h2>
            <p className="text-sm text-ink-500">
              {appointment.doctor.firstName} {appointment.doctor.lastName}
            </p>
          </header>

          {appointment.status === 'CONFIRMED' ? (
            <p className="flex items-center justify-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Turno confirmado
            </p>
          ) : (
            <p className="flex items-center justify-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700">
              <CalendarX2 className="size-4" aria-hidden="true" />
              Turno cancelado
            </p>
          )}

          <dl className="space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Fecha y hora</dt>
              <dd className="text-right font-semibold text-ink-900">
                <time dateTime={appointment.slot.startTime}>
                  {DATE_FORMATTER.format(new Date(appointment.slot.startTime))}
                </time>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Paciente</dt>
              <dd className="text-right font-semibold text-ink-900">
                {appointment.patient?.firstName} {appointment.patient?.lastName}
              </dd>
            </div>
            {appointment.reason ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Motivo</dt>
                <dd className="text-right text-ink-700">{appointment.reason}</dd>
              </div>
            ) : null}
          </dl>

          {appointment.status === 'CONFIRMED' ? (
            <Button
              variant="danger"
              size="lg"
              className="w-full"
              loading={cancelling}
              onClick={handleCancel}
            >
              Cancelar turno
            </Button>
          ) : null}

          <p className="text-center text-xs text-ink-400">
            Esta información se gestiona de forma segura. No compartas el enlace.
          </p>
        </article>
      ) : null}
    </section>
  );
}