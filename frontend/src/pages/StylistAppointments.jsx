import { useState } from 'react';
import { apiGetAppointments, apiUpdateAppointmentStatus } from '../services/api';
import { Button, Description, Notice, Page, Table, TableWrap, Title } from '../components/ManagementUI';
import StatusBadge from '../components/StatusBadge';
import RefreshStatus from '../components/RefreshStatus';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { isFinalStatus } from '../utils/appointmentStatus';
import { subscribeAppointmentsChanged } from '../utils/appointmentEvents';
import { hasAppointmentStarted } from '../utils/date';

function StylistAppointments() {
  const live = useAutoRefresh(apiGetAppointments, { subscribe: subscribeAppointmentsChanged });
  const appointments = live.data ?? [];
  const [error, setError] = useState('');

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
      <RefreshStatus lastUpdated={live.lastUpdated} refreshing={live.refreshing} onRefresh={live.refresh} />
      {(error || live.error) && <Notice $error role="alert">{error || live.error}</Notice>}
      {live.loading ? <p role="status">Cargando citas…</p> : (
        <TableWrap><Table>
          <thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha y hora</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{appointments.map(appointment => (
            <tr key={appointment._id}>
              <td>{appointment.username}</td><td>{appointment.service}</td><td>{appointment.date} · {appointment.time}</td>
              <td><StatusBadge status={appointment.status} /></td><td>
                {appointment.status === 'PENDING' && <Button type="button" onClick={() => updateStatus(appointment._id, 'CONFIRMED')}>Confirmar</Button>}
                {appointment.status === 'CONFIRMED' && hasAppointmentStarted(appointment) &&
                  <Button type="button" onClick={() => updateStatus(appointment._id, 'COMPLETED')}>Marcar como completada</Button>}
                {!isFinalStatus(appointment.status) && <Button type="button" $danger onClick={() => updateStatus(appointment._id, 'CANCELLED')}>Cancelar</Button>}
              </td>
            </tr>
          ))}</tbody>
        </Table></TableWrap>
      )}
    </Page>
  );
}

export default StylistAppointments;
