import styled from 'styled-components';
import { shimmer, theme } from '../styles/theme';
import RefreshStatus from './RefreshStatus';
import StatusBadge from './StatusBadge';

const Section = styled.section`
  position: relative;
  margin-bottom: 2.5rem;
  padding: 1.75rem 1.75rem 1.5rem;
  overflow: hidden;
  border: 1px solid #e4dccd;
  border-radius: ${theme.borderRadius.medium};
  background: white;
  box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04), 0 8px 24px rgba(60, 40, 10, 0.06);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent}, ${theme.colors.secondary});
  }
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid #eee8dc;

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
  padding: 1.1rem 1.25rem;
  border: 1px solid #efe3cc;
  border-left: 4px solid ${theme.colors.accent};
  border-radius: 12px;
  background: linear-gradient(135deg, #fdf8ef, #f8efdf);

  strong {
    color: ${theme.colors.primaryDark};
    font-family: ${theme.fonts.primary};
    font-size-adjust: none;
    font-variant-numeric: lining-nums;
    font-size: 2.6rem;
    line-height: 1.05;
  }

  span {
    color: ${theme.colors.textLight};
    font-size: 1.02rem;
    font-weight: 700;
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
    padding: 0.8rem 0.75rem;
    border-top: 1px solid #eee8dc;
    border-radius: 8px;
    font-size: 1.08rem;
    transition: background ${theme.transitions.fast};
  }

  li:hover {
    background: #fdf8ef;
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
  font-size: 1.5rem;
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
