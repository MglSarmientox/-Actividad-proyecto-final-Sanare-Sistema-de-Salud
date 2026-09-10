import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/apiService';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          firstName: String(formData.get('firstName') ?? ''),
          lastName: String(formData.get('lastName') ?? ''),
          email,
          password,
          phone: String(formData.get('phone') ?? '') || undefined,
          documentId: String(formData.get('documentId') ?? '') || undefined,
        });
      }
      navigate('/');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Ocurrió un error inesperado',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <PageHeader
        title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        description={
          mode === 'login'
            ? 'Accede para gestionar tus turnos.'
            : 'Regístrate como paciente y reserva turnos médicos.'
        }
      />

      <div className="mt-6 flex rounded-lg bg-ink-100 p-1" role="tablist" aria-label="Modos de acceso">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => switchMode('login')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'login' ? 'bg-white text-primary-700 shadow-sm' : 'text-ink-600'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          onClick={() => switchMode('register')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'register' ? 'bg-white text-primary-700 shadow-sm' : 'text-ink-600'
          }`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}

        {mode === 'register' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="firstName">
              <Input id="firstName" name="firstName" required autoComplete="given-name" />
            </Field>
            <Field label="Apellido" htmlFor="lastName">
              <Input id="lastName" name="lastName" required autoComplete="family-name" />
            </Field>
          </div>
        ) : null}

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
          />
        </Field>

        <Field label="Contraseña" htmlFor="password" hint={mode === 'register' ? 'Mínimo 8 caracteres con mayúscula y número.' : undefined}>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === 'register' ? 8 : undefined}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
          />
        </Field>

        {mode === 'register' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Documento" htmlFor="documentId">
              <Input id="documentId" name="documentId" placeholder="CC1234567" />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" placeholder="+57 300 000 0000" />
            </Field>
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {mode === 'login' ? (
          <>
            ¿No tienes cuenta?{' '}
            <button type="button" className="font-semibold text-primary-700 hover:underline" onClick={() => switchMode('register')}>
              Regístrate gratis
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{' '}
            <button type="button" className="font-semibold text-primary-700 hover:underline" onClick={() => switchMode('login')}>
              Inicia sesión
            </button>
          </>
        )}
      </p>

      <p className="mt-4 text-center text-xs text-ink-400">
        Para demo: administrador <code>admin@saludpublica.com</code> ·{' '}
        <code>Admin123!</code>
      </p>
      <p className="mt-2 text-center">
        <Link to="/triaje" className="text-sm font-medium text-primary-700 hover:underline">
          Puedes consultar el triaje sin iniciar sesión
        </Link>
      </p>
    </section>
  );
}