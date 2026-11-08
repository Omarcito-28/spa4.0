import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { apiGetAppointments, apiGetUsers } from '../services/api';
import { AppointmentList, LivePanel } from '../components/LivePanel';
import { Page, Title } from '../components/ManagementUI';
import KpiGrid from '../components/dashboard/KpiGrid';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { subscribeAppointmentsChanged } from '../utils/appointmentEvents';
import { appointmentsOn, compareByDateTime, recentRequests, unassignedAppointments } from '../utils/appointmentSummary';
import { todayInTimeZone } from '../utils/date';

const Header = styled.header`
  margin-bottom: 1.75rem;

  p {
    color: ${theme.colors.textMuted};
    font-size: 1.15rem;
  }

  strong {
    color: ${theme.colors.text};
  }
`;

const QuickActions = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid ${theme.colors.dashboardCardBorder};
  border-radius: ${theme.borderRadius.medium};
  background: white;
  box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04), 0 8px 24px rgba(60, 40, 10, 0.05);

  > span {
    margin-right: 0.4rem;
    color: ${theme.colors.textMuted};
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    border: 1px solid #e6d7b9;
    border-radius: 999px;
    background: #fdf8ef;
    color: ${theme.colors.primaryDark};
    font-size: 1.02rem;
    font-weight: 700;
    text-decoration: none;
    transition: all ${theme.transitions.fast};
  }

  a:first-of-type {
    border-color: transparent;
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    box-shadow: 0 3px 10px rgba(153, 101, 21, 0.28);
    color: white;
  }

  a:hover {
    transform: translateY(-1px);
    border-color: ${theme.colors.accent};
    box-shadow: 0 4px 12px rgba(153, 101, 21, 0.2);
    text-decoration: none;
  }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem 2rem;
`;

const QUICK_ACTIONS = [
  { to: '/admin/appointments', label: 'Gestionar citas', icon: 'fa-calendar-check' },
  { to: '/admin/agenda', label: 'Cerrar agenda', icon: 'fa-calendar-xmark' },
  { to: '/admin/services', label: 'Catálogo de servicios', icon: 'fa-spa' },
  { to: '/admin/users', label: 'Usuarios', icon: 'fa-user-plus' },
  { to: '/admin/reports', label: 'Reportes', icon: 'fa-chart-line' },
];

// Los usuarios son un dato secundario: si fallan, el panel de citas sigue funcionando.
const loadDashboard = async () => {
  const [appointments, users] = await Promise.all([
    apiGetAppointments(),
    apiGetUsers().catch(() => null),
  ]);
  return { appointments, users };
};

const longDate = date => new Intl.DateTimeFormat('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

function AdminSummary() {
  const live = useAutoRefresh(loadDashboard, { subscribe: subscribeAppointmentsChanged });
  const appointments = live.data?.appointments ?? [];
  const users = live.data?.users;
  const todays = appointmentsOn(appointments, todayInTimeZone());
  const countRole = role => (users ? users.filter(item => item.role === role).length : '—');

  const kpis = [
    { icon: 'fa-calendar-day', label: 'Citas hoy', value: todays.length, highlight: true },
    { icon: 'fa-hourglass-half', label: 'Por confirmar', value: appointments.filter(item => item.status === 'PENDING').length },
    { icon: 'fa-user-slash', label: 'Sin estilista', value: unassignedAppointments(appointments).length },
    { icon: 'fa-circle-check', label: 'Completadas hoy', value: todays.filter(item => item.status === 'COMPLETED').length },
    { icon: 'fa-users', label: 'Clientes', value: countRole('CLIENT') },
    { icon: 'fa-scissors', label: 'Estilistas', value: countRole('STYLIST') },
  ];

  return (
    <LivePanel title="Operación en vivo" live={live}>
      <KpiGrid kpis={kpis} />
      <Columns>
        <div>
          <AppointmentList
            title="Solicitudes recientes"
            appointments={recentRequests(appointments)}
            empty="No hay solicitudes pendientes."
            describe={item => `${item.username} · ${item.stylist || 'sin estilista'}`}
          />
        </div>
        <div>
          <AppointmentList
            title="Agenda de hoy"
            appointments={[...todays].sort(compareByDateTime)}
            empty="No hay citas para hoy."
            describe={item => (item.stylist ? `${item.username} con ${item.stylist}` : `${item.username}, sin estilista`)}
          />
        </div>
      </Columns>
    </LivePanel>
  );
}

function AdminDashboard({ user }) {
  return (
    <Page $wide>
      <Header>
        <Title>Dashboard</Title>
        <p>
          Hola, <strong>{user?.fullName || user?.username}</strong>. Este es el resumen del salón para hoy, {longDate(todayInTimeZone())}.
        </p>
      </Header>

      <QuickActions aria-label="Acciones rápidas">
        <span>Acciones rápidas</span>
        {QUICK_ACTIONS.map(action => (
          <Link key={action.to} to={action.to}>
            <i className={`fas ${action.icon}`} aria-hidden="true"></i>{action.label}
          </Link>
        ))}
      </QuickActions>

      <AdminSummary />
    </Page>
  );
}

export default AdminDashboard;
