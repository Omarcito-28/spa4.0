import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StylistDashboard from './pages/StylistDashboard';
import Services from './pages/Services';
import BookingForm from './components/BookingForm';
import { useEffect } from 'react';

function ContactPage() {
  useEffect(() => {
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return <Home isAuthenticated={false} />;
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
  return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Mis Citas</h2><p>Próximamente...</p></div>;
}

function App() {
  const { user, isAuthenticated, login, logout, register } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Layout isAuthenticated={isAuthenticated} user={user} onLogout={logout} />}>
        <Route index element={<Home isAuthenticated={isAuthenticated} />} />
        <Route path="login" element={<Login onLogin={login} />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/login" replace />} />
        <Route path="admin/dashboard" element={isAuthenticated && user?.role === 'ADMIN' ? <AdminDashboard user={user} /> : <Navigate to="/login" replace />} />
        <Route path="stylist/dashboard" element={isAuthenticated && user?.role === 'STYLIST' ? <StylistDashboard user={user} /> : <Navigate to="/login" replace />} />
        <Route path="services" element={<Services />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="appointments/new" element={<NewAppointmentPage isAuthenticated={isAuthenticated} />} />
        <Route path="appointments/my" element={<MyAppointmentsPage isAuthenticated={isAuthenticated} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
