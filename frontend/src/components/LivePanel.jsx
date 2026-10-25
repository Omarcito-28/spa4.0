import styled from 'styled-components';
import { shimmer, theme } from '../styles/theme';
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
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.15rem 0.9rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid #eee8dc;
  border-radius: 14px;
  background: linear-gradient(135deg, #fffdf8, #faf3e3);

  .stat-icon {
    grid-row: span 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    color: white;
    font-size: 1.15rem;
    box-shadow: 0 4px 10px rgba(153, 101, 21, 0.25);
  }

  strong {
    color: ${theme.colors.primaryDark};
    font-size: 2.7rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: lining-nums;
  }

  span {
    color: ${theme.colors.textMuted};
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    opacity: 0.75;
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
    padding: 0.9rem 0.5rem;
    border-top: 1px solid #eee8dc;
    font-size: 1.1rem;
    transition: background 0.15s ease;
  }

  li:hover {
    background: #fdfaf4;
  }
`;

const Skeleton = styled.div`
  height: 76px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f3ecdc 25%, #fbf6ea 50%, #f3ecdc 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s linear infinite;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
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
      {live.loading ? (
        <div role="status" aria-label="Cargando">
          <SkeletonGrid><Skeleton /><Skeleton /><Skeleton /><Skeleton /></SkeletonGrid>
          <span style={{ position: 'absolute', left: '-9999px' }}>Cargando…</span>
        </div>
      ) : children}
    </Section>
  );
}

export function StatGrid({ stats }) {
  return (
    <Stats>
      {stats.map(stat => (
        <StatBox key={stat.label}>
          {stat.icon && <div className="stat-icon" aria-hidden="true"><i className={`fas ${stat.icon}`}></i></div>}
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </StatBox>
      ))}
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
