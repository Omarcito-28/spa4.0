import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/auth';
import Layout from './components/Layout';
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
import AdminAppointments from './pages/AdminAppointments';
import StylistAppointments from './pages/StylistAppointments';
import StylistSchedule from './pages/StylistSchedule';
import AdminReports from './pages/AdminReports';
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

function NewAppointmentPage({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <BookingForm />;
}

function MyAppointmentsPage({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <ClientAppointments />;
}

function App() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  if (loading) return <div role="status" style={{ padding: '3rem', textAlign: 'center' }}>Cargando tu cuenta…</div>;

  return (
    <Routes>
      <Route path="/" element={<Layout isAuthenticated={isAuthenticated} user={user} onLogout={logout} />}>
        <Route index element={<Home isAuthenticated={isAuthenticated} />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<PasswordRecovery />} />
        <Route path="reset-password" element={<PasswordRecovery />} />
        <Route path="dashboard" element={!isAuthenticated ? <Navigate to="/login" replace /> : user?.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : user?.role === 'STYLIST' ? <Navigate to="/stylist/dashboard" replace /> : <Dashboard user={user} />} />
        <Route path="admin/dashboard" element={isAuthenticated && user?.role === 'ADMIN' ? <AdminDashboard user={user} /> : <Navigate to="/login" replace />} />
        <Route path="stylist/dashboard" element={isAuthenticated && user?.role === 'STYLIST' ? <StylistDashboard user={user} /> : <Navigate to="/login" replace />} />
        <Route path="stylist/appointments" element={isAuthenticated && user?.role === 'STYLIST' ? <StylistAppointments /> : <Navigate to="/login" replace />} />
        <Route path="stylist/schedule" element={isAuthenticated && user?.role === 'STYLIST' ? <StylistSchedule /> : <Navigate to="/login" replace />} />
        <Route path="admin/users" element={isAuthenticated && user?.role === 'ADMIN' ? <AdminUsers /> : <Navigate to="/login" replace />} />
        <Route path="admin/services" element={isAuthenticated && user?.role === 'ADMIN' ? <AdminServices /> : <Navigate to="/login" replace />} />
        <Route path="appointments/all" element={isAuthenticated && user?.role === 'ADMIN' ? <AdminAppointments /> : <Navigate to="/login" replace />} />
        <Route path="admin/reports" element={isAuthenticated && user?.role === 'ADMIN' ? <AdminReports /> : <Navigate to="/login" replace />} />
        <Route path="profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
        <Route path="services" element={<Services isAuthenticated={isAuthenticated} />} />
        <Route path="contact" element={<ContactPage isAuthenticated={isAuthenticated} />} />
        <Route path="appointments/new" element={<NewAppointmentPage isAuthenticated={isAuthenticated} />} />
        <Route path="appointments/my" element={<MyAppointmentsPage isAuthenticated={isAuthenticated} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
