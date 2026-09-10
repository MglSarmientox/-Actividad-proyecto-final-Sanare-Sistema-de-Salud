import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Navbar } from './components/Navbar';
import { useAuth } from './context/AuthContext';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { BookingSystem } from './pages/BookingSystem';
import { Landing } from './pages/Landing';
import { MyAppointments } from './pages/MyAppointments';
import { TriageChat } from './pages/TriageChat';
import { TurnoPublic } from './pages/TurnoPublic';
import { Spinner } from './components/ui/Spinner';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <Spinner label="Verificando sesión…" />
      </main>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <Spinner label="Verificando sesión…" />
      </main>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/triaje" element={<TriageChat />} />
          <Route path="/reservar" element={<BookingSystem />} />
          <Route path="/turno/:token" element={<TurnoPublic />} />
          <Route
            path="/turnos"
            element={
              <RequireAuth>
                <MyAppointments />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}