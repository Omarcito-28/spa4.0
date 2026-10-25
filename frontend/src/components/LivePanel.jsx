import styled from 'styled-components';
import { theme } from '../styles/theme';
import RefreshStatus from './RefreshStatus';
import StatusBadge from './StatusBadge';

const Section = styled.section`
  margin-bottom: 2.5rem;
  padding: 1.5rem 1.75rem;
  border-radius: ${theme.borderRadius.medium};
  background: white;
  box-shadow: ${theme.shadows.small};
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;

  h2 {
    margin: 0;
    color: ${theme.colors.text};
    font-size: 1.7rem;
  }
`;

const ErrorText = styled.p`
  margin: 0 0 1rem;
  color: #b93224;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

const StatBox = styled.div`
  padding: 1rem 1.15rem;
  border-radius: 12px;
  border-left: 4px solid ${theme.colors.accent};
  background: #faf6ee;

  strong {
    display: block;
    color: ${theme.colors.primaryDark};
    font-size: 2.2rem;
    line-height: 1.1;
  }

  span {
    color: ${theme.colors.textMuted};
    font-size: 1.05rem;
    font-weight: 600;
  }
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem 1rem;
    padding: 0.75rem 0;
    border-top: 1px solid #eee8dc;
    font-size: 1.1rem;
  }
`;

const Muted = styled.p`
  margin: 0;
  color: ${theme.colors.textMuted};
`;

const ListTitle = styled.h3`
  margin: 0 0 0.5rem;
  color: ${theme.colors.text};
  font-size: 1.3rem;
`;

// Tarjeta con datos en vivo de un dashboard: título, "Actualizado hace X s" y botón de refresco.
export function LivePanel({ title, live, children }) {
  return (
    <Section aria-label={title}>
      <Header>
        <h2>{title}</h2>
        <RefreshStatus lastUpdated={live.lastUpdated} refreshing={live.refreshing} onRefresh={live.refresh} />
      </Header>
      {live.error && <ErrorText role="alert">{live.error}</ErrorText>}
      {live.loading ? <Muted role="status">Cargando…</Muted> : children}
    </Section>
  );
}

export function StatGrid({ stats }) {
  return (
    <Stats>
      {stats.map(stat => <StatBox key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></StatBox>)}
    </Stats>
  );
}

// `describe(appointment)` devuelve el texto secundario de cada fila (cliente o estilista).
export function AppointmentList({ title, appointments, empty, describe }) {
  return (
    <>
      <ListTitle>{title}</ListTitle>
      {appointments.length === 0 ? <Muted>{empty}</Muted> : (
        <List>{appointments.map(appointment => (
          <li key={appointment._id}>
            <span><strong>{appointment.date} · {appointment.time}</strong> — {appointment.service}{describe ? ` · ${describe(appointment)}` : ''}</span>
            <StatusBadge status={appointment.status} />
          </li>
        ))}</List>
      )}
    </>
  );
}
