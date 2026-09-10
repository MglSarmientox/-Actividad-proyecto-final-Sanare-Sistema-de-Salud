import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, Stethoscope } from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Field, Textarea } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/apiService';
import type { Appointment, Doctor, Slot, Specialty } from '../types';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: '2-digit',
  minute: '2-digit',
});

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextDates(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

export function BookingSystem() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedSpecialty = searchParams.get('especialidad');

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [specialtyId, setSpecialtyId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  const [dates] = useState<Date[]>(() => nextDates(7));
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [reason, setReason] = useState('');

  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSpecialties()
      .then((data) => {
        setSpecialties(data);
        if (preselectedSpecialty) {
          const match = data.find(
            (specialty) => specialty.name.toLowerCase() === preselectedSpecialty.toLowerCase(),
          );
          if (match) {
            setSpecialtyId(match.id);
          }
        }
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las especialidades'),
      )
      .finally(() => setLoadingSpecialties(false));
  }, [preselectedSpecialty]);

  useEffect(() => {
    if (!specialtyId) {
      return;
    }
    setLoadingDoctors(true);
    setDoctorId('');
    setDoctor(null);
    setSlots([]);
    setSelectedSlotId('');
    setSelectedDate('');
    api
      .getDoctors(specialtyId)
      .then((data) => setDoctors(data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los médicos'),
      )
      .finally(() => setLoadingDoctors(false));
  }, [specialtyId]);

  useEffect(() => {
    if (!doctorId) {
      return;
    }
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlotId('');
    api
      .getDoctor(doctorId)
      .then((data) => setDoctor({ ...data } as Doctor))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el médico'),
      )
      .finally(() => setLoadingSlots(false));
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || !selectedDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlotId('');
    api
      .getAvailableSlots(doctorId, selectedDate)
      .then((data) => setSlots(data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los horarios'),
      )
      .finally(() => setLoadingSlots(false));
  }, [doctorId, selectedDate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSlotId) {
      return;
    }
    setError(null);
    setWaitlistMessage(null);
    setLoadingBooking(true);
    try {
      const appointment = await api.createAppointment({
        slotId: selectedSlotId,
        reason: reason.trim() || undefined,
      });
      setConfirmed(appointment);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setLoadingBooking(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!doctorId) {
      return;
    }
    setLoadingWaitlist(true);
    setError(null);
    try {
      const result = await api.joinWaitlist(doctorId);
      setWaitlistMessage(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo unir a la lista de espera');
    } finally {
      setLoadingWaitlist(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <PageHeader title="Reserva tu turno" />
        <article className="mt-6 space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
          <Stethoscope className="mx-auto size-10 text-primary-600" aria-hidden="true" />
          <p className="text-ink-600">
            Necesitas iniciar sesión para reservar un turno médico.
          </p>
          <Link
            to="/auth"
            className="inline-block rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700"
          >
            Iniciar sesión
          </Link>
        </article>
      </section>
    );
  }

  if (confirmed) {
    return (
      <section className="mx-auto max-w-md px-4 py-12 text-center sm:px-6">
        <article className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-green-600" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-ink-900">Turno confirmado</h2>
          <p className="text-ink-600">
            Revisa tu email para recibir la confirmación y los recordatorios.
          </p>
          <dl className="rounded-xl bg-green-50 p-4 text-left text-sm">
            <div className="flex justify-between py-1">
              <dt className="text-green-700">Especialidad</dt>
              <dd className="font-semibold text-ink-900">{confirmed.specialty.name}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-green-700">Médico</dt>
              <dd className="font-semibold text-ink-900">
                {confirmed.doctor.firstName} {confirmed.doctor.lastName}
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-green-700">Fecha y hora</dt>
              <dd className="font-semibold text-ink-900">
                <time dateTime={confirmed.slot.startTime}>
                  {DATE_FORMATTER.format(new Date(confirmed.slot.startTime))} ·{' '}
                  {TIME_FORMATTER.format(new Date(confirmed.slot.startTime))}
                </time>
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2">
            <Link
              to={`/turno/${confirmed.token}`}
              className="rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700"
            >
              Ver detalle y cancelar
            </Link>
            <Link
              to="/turnos"
              className="rounded-lg border border-ink-300 px-6 py-3 font-semibold text-ink-700 hover:bg-ink-50"
            >
              Mis turnos
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Reserva tu turno"
        description="Elige especialidad, médico, día y hora."
      />

      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}
      {waitlistMessage ? <div className="mt-4"><Alert tone="success">{waitlistMessage}</Alert></div> : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-ink-800">
            1. Especialidad
          </legend>
          {loadingSpecialties ? (
            <Spinner />
          ) : (
            <ul className="flex flex-wrap gap-2" role="listbox" aria-label="Especialidades">
              {specialties.map((specialty) => (
                <li key={specialty.id} role="option" aria-selected={specialtyId === specialty.id}>
                  <button
                    type="button"
                    onClick={() => setSpecialtyId(specialty.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      specialtyId === specialty.id
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-ink-300 bg-white text-ink-600 hover:border-primary-400'
                    }`}
                    style={
                      specialty.color && specialtyId !== specialty.id
                        ? { borderColor: specialty.color }
                        : undefined
                    }
                  >
                    {specialty.name}
                    {specialty._count ? ` (${specialty._count.doctors})` : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-ink-800">2. Médico</legend>
          {!specialtyId ? (
            <p className="text-sm text-ink-400">Selecciona primero una especialidad.</p>
          ) : loadingDoctors ? (
            <Spinner />
          ) : doctors.length === 0 ? (
            <p className="text-sm text-ink-500">No hay médicos disponibles en esta especialidad.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2" role="listbox" aria-label="Médicos">
              {doctors.map((item) => (
                <li key={item.id} role="option" aria-selected={doctorId === item.id}>
                  <button
                    type="button"
                    onClick={() => setDoctorId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      doctorId === item.id
                        ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                        : 'border-ink-200 bg-white hover:border-primary-300'
                    }`}
                  >
                    <span className="block font-semibold text-ink-900">
                      {item.firstName} {item.lastName}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-sm text-ink-500">
                      <Stethoscope className="size-4 text-primary-600" aria-hidden="true" />
                      {item.specialty.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        {doctor ? (
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 bg-ink-50 px-5 py-3">
              <div>
                <h3 className="font-semibold text-ink-900">
                  {doctor.firstName} {doctor.lastName}
                </h3>
                <p className="text-sm text-ink-500">
                  {doctor.specialty.name} · {doctor._count?.slots ?? 0} turnos disponibles
                </p>
              </div>
            </header>

            <div className="space-y-4 p-5">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                  <CalendarDays className="size-4 text-primary-600" aria-hidden="true" />
                  3. Elige el día
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2" role="listbox" aria-label="Días disponibles">
                  {dates.map((date) => {
                    const dateKey = toDateKey(date);
                    return (
                      <button
                        key={dateKey}
                        type="button"
                        role="option"
                        aria-selected={selectedDate === dateKey}
                        onClick={() => setSelectedDate(dateKey)}
                        className={`min-w-20 shrink-0 rounded-xl border px-3 py-2 text-sm transition-colors ${
                          selectedDate === dateKey
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-ink-200 bg-white text-ink-700 hover:border-primary-400'
                        }`}
                      >
                        {DATE_FORMATTER.format(date)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate ? (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                    <Clock className="size-4 text-primary-600" aria-hidden="true" />
                    4. Elige la hora
                  </p>
                  {loadingSlots ? (
                    <Spinner />
                  ) : slots.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-ink-500">
                        No hay horarios disponibles para este día.
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        loading={loadingWaitlist}
                        onClick={handleJoinWaitlist}
                      >
                        Unirme a la lista de espera
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ul className="flex flex-wrap gap-2" role="listbox" aria-label="Horarios">
                        {slots.map((slot) => (
                          <li key={slot.id} role="option" aria-selected={selectedSlotId === slot.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                                selectedSlotId === slot.id
                                  ? 'border-primary-600 bg-primary-600 text-white'
                                  : 'border-ink-300 bg-white text-ink-700 hover:border-primary-500'
                              }`}
                            >
                              {TIME_FORMATTER.format(new Date(slot.startTime))}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        loading={loadingWaitlist}
                        onClick={handleJoinWaitlist}
                      >
                        Agotados? Únete a la lista de espera
                      </Button>
                    </>
                  )}
                </div>
              ) : null}

              <Field label="Motivo de consulta (opcional)" htmlFor="reason">
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Breve descripción de tu consulta"
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!selectedSlotId}
                loading={loadingBooking}
              >
                Confirmar reserva
              </Button>
            </div>
          </div>
        ) : null}
      </form>
    </section>
  );
}