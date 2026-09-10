import { Hospital, LogOut, Menu, Stethoscope, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/triaje', label: 'Triaje' },
  { to: '/reservar', label: 'Reservar' },
];

function linkClassName({ isActive }: { isActive: boolean }): string {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-50 text-primary-700'
      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
  }`;
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [...NAV_LINKS];
  if (isAuthenticated && user) {
    links.push({ to: '/turnos', label: 'Mis turnos' });
    if (user.role === 'ADMIN') {
      links.push({ to: '/admin', label: 'Panel admin' });
    }
  }

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
        aria-label="Navegación principal"
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold text-ink-900"
        >
          <Hospital className="size-7 text-primary-600" aria-hidden="true" />
          <span>
            Salud
            <span className="text-primary-600">Pública</span> Sanare
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={linkClassName} end={link.to === '/'}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-ink-600">
                <Stethoscope className="mr-1 inline size-4 text-primary-600" aria-hidden="true" />
                {user.firstName} {user.lastName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Salir
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open ? (
        <nav
          className="border-t border-ink-200 bg-white px-4 py-3 md:hidden"
          aria-label="Navegación móvil"
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-ink-600 hover:bg-ink-100'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 border-t border-ink-200 pt-2">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Iniciar sesión
                </Link>
              )}
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}