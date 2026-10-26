import { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { apiGetAppointments, apiUpdateAppointmentStatus } from '../services/api';
import { Button, Description, EmptyCell, Notice, Page, Table, TableWrap, Title } from '../components/ManagementUI';
import StatusBadge from '../components/StatusBadge';
import RefreshStatus from '../components/RefreshStatus';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { isFinalStatus } from '../utils/appointmentStatus';
import { subscribeAppointmentsChanged } from '../utils/appointmentEvents';
import { compareByDateTime } from '../utils/appointmentSummary';
import { hasAppointmentStarted } from '../utils/date';

const FILTERS = [
  { id: 'all', label: 'Todas', matches: () => true },
  { id: 'pending', label: 'Por confirmar', matches: item => item.status === 'PENDING' },
  { id: 'confirmed', label: 'Confirmadas', matches: item => item.status === 'CONFIRMED' },
  { id: 'history', label: 'Historial', matches: item => isFinalStatus(item.status) },
];

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 1.25rem;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.35rem;
  border: 1px solid #e4dccd;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 1rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: ${theme.colors.text};
    font: inherit;
    font-size: 1rem;
    font-weight: 600;
    transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};
  }

  button:hover {
    background: #faf3e6;
  }

  button[aria-pressed='true'] {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    color: white;
    box-shadow: 0 3px 10px rgba(153, 101, 21, 0.25);
  }

  span {
    min-width: 1.6rem;
    padding: 0 0.4rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.07);
    font-size: 0.85rem;
    text-align: center;
  }

  button[aria-pressed='true'] span {
    background: rgba(255, 255, 255, 0.25);
  }
`;

const When = styled.td`
  white-space: nowrap;

  strong {
    display: block;
  }

  small {
    color: ${theme.colors.textMuted};
    font-size: 0.95rem;
  }
`;

const ServiceCell = styled.td`
  small {
    display: block;
    max-width: 280px;
    color: ${theme.colors.textMuted};
    font-size: 0.92rem;
    font-style: italic;
  }
`;

const Actions = styled.td`
  white-space: nowrap;
`;

function StylistAppointments() {
  const live = useAutoRefresh(apiGetAppointments, { subscribe: subscribeAppointmentsChanged });
  const appointments = [...(live.data ?? [])].sort(compareByDateTime);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const active = FILTERS.find(item => item.id === filter);
  const visible = appointments.filter(active.matches);

  const updateStatus = async (id, status) => {
    try {
      await apiUpdateAppointmentStatus(id, status);
      setError('');
      await live.refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <Page>
      <Title>Mis citas asignadas</Title>
      <Description>Gestiona las reservas que la administración asignó a tu agenda.</Description>
      <Bar>
        <Filters role="group" aria-label="Filtrar citas">
          {FILTERS.map(item => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label}<span>{appointments.filter(item.matches).length}</span>
            </button>
          ))}
        </Filters>
        <RefreshStatus lastUpdated={live.lastUpdated} refreshing={live.refreshing} onRefresh={live.refresh} />
      </Bar>
      {(error || live.error) && <Notice $error role="alert">{error || live.error}</Notice>}
      {live.loading ? <p role="status">Cargando citas…</p> : (
        <TableWrap><Table>
          <thead><tr><th>Fecha y hora</th><th>Cliente</th><th>Servicio</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {visible.length === 0 && (
              <tr><EmptyCell colSpan={5}>
                {filter === 'all' ? 'Todavía no tienes citas asignadas.' : `No hay citas en "${active.label}".`}
              </EmptyCell></tr>
            )}
            {visible.map(appointment => (
              <tr key={appointment._id}>
                <When><strong>{appointment.date}</strong><small>{appointment.time}</small></When>
                <td>{appointment.username}</td>
                <ServiceCell>{appointment.service}{appointment.notes && <small title={appointment.notes}>“{appointment.notes}”</small>}</ServiceCell>
                <td><StatusBadge status={appointment.status} /></td>
                <Actions>
                  {appointment.status === 'PENDING' && <Button type="button" onClick={() => updateStatus(appointment._id, 'CONFIRMED')}>Confirmar</Button>}
                  {appointment.status === 'CONFIRMED' && hasAppointmentStarted(appointment) &&
                    <Button type="button" onClick={() => updateStatus(appointment._id, 'COMPLETED')}>Marcar como completada</Button>}
                  {!isFinalStatus(appointment.status) && <Button type="button" $danger onClick={() => updateStatus(appointment._id, 'CANCELLED')}>Cancelar</Button>}
                </Actions>
              </tr>
            ))}
          </tbody>
        </Table></TableWrap>
      )}
    </Page>
  );
}

export default StylistAppointments;
