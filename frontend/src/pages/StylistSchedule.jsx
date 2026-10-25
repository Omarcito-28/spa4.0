import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { apiGetSchedule, apiUpdateSchedule } from '../services/api';
import { Button, Card, Description, Notice, Page, Table, TableWrap, Title } from '../components/ManagementUI';

const ScheduleTimeInput = styled.input`
  font-size: 1.1rem;
`;

const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const defaultSchedule = daysOfWeek.map((_, day) => ({
  day,
  enabled: day >= 1 && day <= 6,
  start: '09:00',
  end: day === 6 ? '17:00' : '19:00',
}));

function StylistSchedule() {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const saved = await apiGetSchedule();
      if (saved.length) setSchedule(saved);
    } catch (error) {
      setNotice({ error: true, text: error.message });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const change = (day, field, value) => setSchedule(current =>
    current.map(item => item.day === day ? { ...item, [field]: value } : item));

  const save = async event => {
    event.preventDefault();
    try {
      setSchedule(await apiUpdateSchedule(schedule));
      setNotice({ error: false, text: 'Tu horario semanal quedó guardado y se usará para validar reservas.' });
    } catch (error) {
      setNotice({ error: true, text: error.message });
    }
  };

  return (
    <Page>
      <Title>Mi horario</Title>
      <Description>Configura tus horas de disponibilidad. Las reservas asignadas fuera de este horario se rechazan.</Description>
      <Card>
        <form onSubmit={save}>
          <TableWrap><Table>
            <thead><tr><th>Día</th><th>Disponible</th><th>Desde</th><th>Hasta</th></tr></thead>
            <tbody>{schedule.map(item => (
              <tr key={item.day}>
                <td>{daysOfWeek[item.day]}</td>
                <td><input type="checkbox" checked={item.enabled} onChange={event => change(item.day, 'enabled', event.target.checked)} aria-label={`Disponible ${daysOfWeek[item.day]}`} /></td>
                <td><ScheduleTimeInput type="time" value={item.start} disabled={!item.enabled} onChange={event => change(item.day, 'start', event.target.value)} /></td>
                <td><ScheduleTimeInput type="time" value={item.end} disabled={!item.enabled} onChange={event => change(item.day, 'end', event.target.value)} /></td>
              </tr>
            ))}</tbody>
          </Table></TableWrap>
          {notice && <Notice $error={notice.error} role="status">{notice.text}</Notice>}
          <Button type="submit">Guardar horario</Button>
        </form>
      </Card>
    </Page>
  );
}

export default StylistSchedule;
