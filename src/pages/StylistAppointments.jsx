import { useCallback, useEffect, useState } from 'react';
import { apiGetAppointments, apiUpdateAppointmentStatus } from '../services/api';
import { Button, Description, Notice, Page, Table, TableWrap, Title } from '../components/ManagementUI';

function StylistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setAppointments(await apiGetAppointments());
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await apiUpdateAppointmentStatus(id, status);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <Page>
      <Title>Mis citas asignadas</Title>
      <Description>Gestiona las reservas que la administración asignó a tu agenda.</Description>
      {error && <Notice $error role="alert">{error}</Notice>}
      <TableWrap><Table>
        <thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha y hora</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{appointments.map(appointment => (
          <tr key={appointment._id}>
            <td>{appointment.username}</td><td>{appointment.service}</td><td>{appointment.date} · {appointment.time}</td>
            <td>{appointment.status}</td><td>
              {appointment.status === 'PENDING' && <Button type="button" onClick={() => updateStatus(appointment._id, 'CONFIRMED')}>Confirmar</Button>}
              {appointment.status !== 'CANCELLED' && <Button type="button" $danger onClick={() => updateStatus(appointment._id, 'CANCELLED')}>Cancelar</Button>}
            </td>
          </tr>
        ))}</tbody>
      </Table></TableWrap>
    </Page>
  );
}

export default StylistAppointments;
