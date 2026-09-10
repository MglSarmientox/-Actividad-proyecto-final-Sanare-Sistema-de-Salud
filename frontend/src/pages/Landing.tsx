import {
  BellRing,
  CalendarCheck,
  HeartPulse,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Triaje inteligente',
    description:
      'Describe tus síntomas y la IA recomienda la especialidad y el nivel de urgencia.',
  },
  {
    icon: CalendarCheck,
    title: 'Reservas en línea',
    description:
      'Elige médico, fecha y horario. Confirmación inmediata y sin filas.',
  },
  {
    icon: BellRing,
    title: 'Recordatorios automáticos',
    description: 'Recibe emails de confirmación y recordatorio 24 horas antes.',
  },
  {
    icon: Users,
    title: 'Lista de espera',
    description:
      'Si un turno se libera, te avisamos para que puedas reservarlo.',
  },
  {
    icon: ShieldCheck,
    title: 'Gestión segura',
    description:
      'Autenticación con roles: pacientes, médicos y administradores.',
  },
  {
    icon: Mail,
    title: 'Cancelación fácil',
    description:
      'Cancela tu turno directamente desde el correo de confirmación.',
  },
];

const STEPS = [
  {
    number: '1',
    title: 'Consulta el triaje',
    description: 'Describe tus síntomas y recibe la especialidad recomendada.',
  },
  {
    number: '2',
    title: 'Elige tu turno',
    description: 'Selecciona médico, día y hora entre los disponibles.',
  },
  {
    number: '3',
    title: 'Recibe la confirmación',
    description: 'El sistema te envía el detalle y recordatorios por email.',
  },
];

export function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
              <HeartPulse className="size-4" aria-hidden="true" />
              Centro de Salud Público · Sanare
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Tu turno médico,
              <br />
              sin filas ni esperas.
            </h1>
            <p className="text-lg text-primary-100">
              Sistema de gestión de turnos para centros de salud públicos.
              Reserva en línea, recibe recordatorios y olvídate del caos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/triaje"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-primary-800 hover:bg-primary-50"
              >
                Consultar triaje
              </Link>
              <Link
                to={isAuthenticated ? '/reservar' : '/auth'}
                className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Reservar turno
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="caracteristicas">
        <PageHeader
          title="¿Qué ofrece el sistema?"
          description="Una solución integral para pacientes, médicos y administradores."
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <Icon className="size-8 text-primary-600" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-ink-900">{title}</h3>
              <p className="mt-1 text-sm text-ink-500">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white py-16" aria-labelledby="como-funciona">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <PageHeader
            title="¿Cómo funciona?"
            description="Tres pasos simples para tu cita médica."
          />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="relative rounded-2xl border border-ink-200 bg-ink-50 p-6"
              >
                <span
                  className="absolute -top-4 left-6 flex size-10 items-center justify-center rounded-full bg-primary-600 font-bold text-white"
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-500">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
          ¿Listo para reservar tu turno?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-ink-500">
          Crea tu cuenta en menos de un minuto y accede al sistema de turnos de
          SaludPública Sanare.
        </p>
        <Link
          to={isAuthenticated ? '/reservar' : '/auth'}
          className="mt-6 inline-block rounded-lg bg-primary-600 px-8 py-3 font-semibold text-white hover:bg-primary-700"
        >
          Comenzar ahora
        </Link>
      </section>
    </>
  );
}