import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { apiGetAppointments } from '../services/api';
import { AppointmentList, LivePanel } from '../components/LivePanel';
import { Page } from '../components/ManagementUI';
import KpiGrid from '../components/dashboard/KpiGrid';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { subscribeAppointmentsChanged } from '../utils/appointmentEvents';
import { appointmentsOn, compareByDateTime, readyToComplete, upcomingAppointments } from '../utils/appointmentSummary';
import { todayInTimeZone } from '../utils/date';

const Banner = styled.header`
  position: relative;
  margin-bottom: 1.75rem;
  padding: 1.75rem 2rem;
  overflow: hidden;
  border-radius: ${theme.borderRadius.medium};
  background: linear-gradient(135deg, ${theme.colors.sidebarBg} 0%, ${theme.colors.sidebarBgEnd} 100%);
  box-shadow: 0 12px 32px rgba(26, 20, 11, 0.18);
  color: rgba(255, 255, 255, 0.82);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: linear-gradient(180deg, ${theme.colors.navbarLinkHover}, ${theme.colors.primary});
  }

  &::after {
    content: '✂';
    position: absolute;
    right: 2rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${theme.colors.accent};
    font-size: 4rem;
    opacity: 0.12;
  }

  h1 {
    margin-bottom: 0.4rem;
    color: ${theme.colors.navbarLinkHover};
    font-size: 2.4rem;
  }

  p {
    margin: 0;
    font-size: 1.1rem;
  }

  strong {
    color: ${theme.colors.navbarLinkHover};
    letter-spacing: 0.5px;
  }

  @media (max-width: 600px) {
    padding: 1.4rem 1.25rem;

    h1 {
      font-size: 2rem;
    }
  }
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(201, 148, 42, 0.4);
  border-radius: 999px;
  background: rgba(201, 148, 42, 0.12);
  color: ${theme.colors.accent};
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
`;

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

const longDate = date => new Intl.DateTimeFormat('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

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
      <Banner>
        <RoleBadge><i className="fas fa-scissors" aria-hidden="true"></i>Estilista</RoleBadge>
        <h1>Hola, {user?.fullName || user?.username} ✨</h1>
        <p>Conectado como <strong>ESTILISTA</strong> · Hoy es {longDate(todayInTimeZone())}.</p>
      </Banner>

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
