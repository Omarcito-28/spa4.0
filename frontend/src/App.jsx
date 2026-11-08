import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/auth';
import Layout from './components/Layout';
import DashboardLayout from './components/dashboard/DashboardLayout';
import ClientAccountLayout from './components/account/ClientAccountLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StylistDashboard from './pages/StylistDashboard';
import Services from './pages/Services';
import BookingForm from './components/BookingForm';
import ClientAppointments from './pages/ClientAppointments';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminServices from './pages/AdminServices';
import AdminHomeCarousel from './pages/AdminHomeCarousel';
import AdminAppointments from './pages/AdminAppointments';
import StylistAppointments from './pages/StylistAppointments';
import StylistSchedule from './pages/StylistSchedule';
import AdminReports from './pages/AdminReports';
import AdminAgenda from './pages/AdminAgenda';
import PasswordRecovery from './pages/PasswordRecovery';
import { useEffect } from 'react';

function ContactPage({ isAuthenticated }) {
  const location = useLocation();
  useEffect(() => {
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.key]);

  return <Home isAuthenticated={isAuthenticated} />;
}

// Sin sesión, va al login y vuelve a la reserva (con el servicio elegido, si venía en la URL).
function NewAppointmentPage({ isAuthenticated }) {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return <BookingForm />;
}

function MyAppointmentsPage({ isAuthenticated }) {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <ClientAppointments />;
}

function App() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  if (loading) return <div role="status" style={{ padding: '3rem', textAlign: 'center' }}>Cargando tu cuenta…</div>;

  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const isStylist = isAuthenticated && user?.role === 'STYLIST';

  return (
    <Routes>
      {/* Los paneles de administrador y estilista tienen su propio layout (sidebar), sin Navbar ni Footer públicos. */}
      <Route path="/admin" element={isAdmin ? <DashboardLayout user={user} onLogout={logout} /> : <Navigate to="/login" replace />}>
        <Route index element={<AdminDashboard user={user} />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="agenda" element={<AdminAgenda />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="home-carousel" element={<AdminHomeCarousel />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="/stylist" element={isStylist ? <DashboardLayout user={user} onLogout={logout} /> : <Navigate to="/login" replace />}>
        <Route index element={<StylistDashboard user={user} />} />
        <Route path="dashboard" element={<Navigate to="/stylist" replace />} />
        {/* La key separa el estado de ambas vistas aunque usen el mismo componente. */}
        <Route path="appointments" element={<StylistAppointments key="appointments" />} />
        <Route path="history" element={<StylistAppointments key="history" initialFilter="history" />} />
        <Route path="schedule" element={<StylistSchedule />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/stylist" replace />} />
      </Route>
      <Route path="/" element={<Layout isAuthenticated={isAuthenticated} user={user} onLogout={logout} />}>
        <Route index element={<Home isAuthenticated={isAuthenticated} />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<PasswordRecovery />} />
        <Route path="reset-password" element={<PasswordRecovery />} />
        {/* Ruta anterior de la lista de citas del administrador. */}
        <Route path="appointments/all" element={isAdmin ? <Navigate to="/admin/appointments" replace /> : <Navigate to="/login" replace />} />
        {/* "Mi cuenta": las páginas del cliente comparten las pestañas del área dentro del sitio público. */}
        <Route element={<ClientAccountLayout user={user} />}>
          <Route path="dashboard" element={!isAuthenticated ? <Navigate to="/login" replace /> : user?.role === 'ADMIN' ? <Navigate to="/admin" replace /> : user?.role === 'STYLIST' ? <Navigate to="/stylist" replace /> : <Dashboard user={user} />} />
          <Route path="appointments/new" element={<NewAppointmentPage isAuthenticated={isAuthenticated} />} />
          <Route path="appointments/my" element={<MyAppointmentsPage isAuthenticated={isAuthenticated} />} />
          <Route path="profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
        </Route>
        <Route path="services" element={<Services isAuthenticated={isAuthenticated} />} />
        <Route path="contact" element={<ContactPage isAuthenticated={isAuthenticated} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
