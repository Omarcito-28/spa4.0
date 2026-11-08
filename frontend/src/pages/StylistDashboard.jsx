import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { apiGetAppointments } from '../services/api';
import { AppointmentList, LivePanel } from '../components/LivePanel';
import { Page } from '../components/ManagementUI';
import KpiGrid from '../components/dashboard/KpiGrid';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { subscribeAppointmentsChanged } from '../utils/appointmentEvents';
import { appointmentsOn, compareByDateTime, readyToComplete, upcomingAppointments } from '../utils/appointmentSummary';
import { todayInTimeZone } from '../utils/date';

const SectionHeading = styled.h2`
  margin: 0 0 1rem;
  color: ${theme.colors.text};
  font-size: 1.7rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
`;

const QuickCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.4rem 1.4rem 1.3rem;
  border: 1px solid ${theme.colors.dashboardCardBorder};
  border-radius: ${theme.borderRadius.medium};
  background: white;
  box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04), 0 8px 24px rgba(60, 40, 10, 0.05);
  text-decoration: none;
  transition: transform ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}, border-color ${theme.transitions.fast};

  i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-bottom: 0.6rem;
    border-radius: 12px;
    background: rgba(201, 148, 42, 0.12);
    color: ${theme.colors.primary};
    font-size: 1.1rem;
    transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};
  }

  strong {
    color: ${theme.colors.text};
    font-size: 1.2rem;
  }

  span {
    color: ${theme.colors.textMuted};
    font-size: 1rem;
    line-height: 1.5;
  }

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(201, 148, 42, 0.45);
    box-shadow: ${theme.shadows.cardHover};
    text-decoration: none;

    i {
      background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
      color: white;
    }
  }
`;

const QUICK_LINKS = [
  { to: '/stylist/appointments', icon: 'fa-calendar-check', title: 'Mis citas', text: 'Confirma, completa o cancela las citas que tienes asignadas.' },
  { to: '/stylist/schedule', icon: 'fa-business-time', title: 'Mi horario', text: 'Configura tu disponibilidad y horarios de trabajo.' },
  { to: '/stylist/history', icon: 'fa-clock-rotate-left', title: 'Historial de citas', text: 'Revisa las citas que ya atendiste o se cerraron.' },
  { to: '/stylist/profile', icon: 'fa-user-pen', title: 'Mi perfil', text: 'Actualiza tu información de contacto y contraseña.' },
];

function StylistSummary() {
  const live = useAutoRefresh(apiGetAppointments, { subscribe: subscribeAppointmentsChanged });
  const appointments = live.data ?? [];
  const today = todayInTimeZone();
  const todays = appointmentsOn(appointments, today);
  return (
    <LivePanel title="Tu agenda de hoy" live={live}>
      <KpiGrid kpis={[
        { icon: 'fa-calendar-day', label: 'Citas hoy', value: todays.length, highlight: true },
        { icon: 'fa-hourglass-half', label: 'Por confirmar', value: upcomingAppointments(appointments, today).filter(item => item.status === 'PENDING').length },
        { icon: 'fa-clipboard-check', label: 'Listas para completar', value: readyToComplete(appointments).length },
        { icon: 'fa-circle-check', label: 'Completadas hoy', value: todays.filter(item => item.status === 'COMPLETED').length },
      ]} />
      <AppointmentList
        title="Citas de hoy"
        appointments={[...todays].sort(compareByDateTime)}
        empty="No tienes citas para hoy."
        describe={item => item.username}
      />
    </LivePanel>
  );
}

function StylistDashboard({ user }) {
  return (
    <Page $wide>
      <WelcomeBanner name={user?.fullName || user?.username} roleLabel="Estilista" icon="fa-scissors" />

      <StylistSummary />

      <section aria-labelledby="stylist-shortcuts">
        <SectionHeading id="stylist-shortcuts">Accesos rápidos</SectionHeading>
        <CardGrid>
          {QUICK_LINKS.map(link => (
            <QuickCard key={link.to} to={link.to}>
              <i className={`fas ${link.icon}`} aria-hidden="true"></i>
              <strong>{link.title}</strong>
              <span>{link.text}</span>
            </QuickCard>
          ))}
        </CardGrid>
      </section>
    </Page>
  );
}

export default StylistDashboard;
