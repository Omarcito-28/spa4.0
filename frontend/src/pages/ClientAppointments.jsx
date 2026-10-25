import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  apiGetAppointments,
  apiGetStylistAvailability,
  apiGetStylists,
  apiRescheduleAppointment,
  apiUpdateAppointmentStatus
} from '../services/api';
import { todayInTimeZone } from '../utils/date';
import { Button, Description, Notice, Page, Table, TableWrap, Title } from '../components/ManagementUI';

const formatTime = minutes => {
  const hour = Math.floor(minutes / 60);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

function RescheduleForm({ appointment, onSaved, onCancel }) {
  const [stylists, setStylists] = useState([]);
  const [date, setDate] = useState('');
  const [stylist, setStylist] = useState(appointment.stylist || '');
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const availabilityKey = `${date}:${stylist}`;
  const availability = availabilityResult?.key === availabilityKey ? availabilityResult.data : null;
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiGetStylists().then(data => {
      if (active) setStylists(data);
    }).catch(requestError => {
      if (active) setError(requestError.message);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!date) return undefined;
    let active = true;
    apiGetStylistAvailability(date, stylist)
      .then(data => { if (active) setAvailabilityResult({ key: availabilityKey, data }); })
      .catch(requestError => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [availabilityKey, date, stylist]);

  const slots = [];
  if (availability?.schedule) {
    const [startHour, startMinute] = availability.schedule.start.split(':').map(Number);
    const [endHour, endMinute] = availability.schedule.end.split(':').map(Number);
    const duration = appointment.duration || 60;
    for (let minutes = startHour * 60 + startMinute; minutes + duration <= endHour * 60 + endMinute; minutes += 15) {
      const candidate = formatTime(minutes);
      const overlaps = availability.appointments.some(existing => {
        if (existing.time === appointment.time && date === appointment.date && stylist === appointment.stylist) return false;
        const [, h, m, period] = existing.time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
        const start = ((Number(h) % 12) + (period === 'PM' ? 12 : 0)) * 60 + Number(m);
        return minutes < start + (existing.duration || 60) && start < minutes + duration;
      });
      if (!overlaps) slots.push({ value: candidate, label: candidate });
    }
  }

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRescheduleAppointment(appointment._id, { date, time, stylist });
      await onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <label>Fecha <input type="date" min={todayInTimeZone()} value={date} onChange={event => { setDate(event.target.value); setTime(''); }} required /></label>{' '}
      <label>Estilista <select value={stylist} onChange={event => { setStylist(event.target.value); setTime(''); }}>
        <option value="">Por asignar</option>
        {stylists.map(item => <option key={item._id} value={item.username}>{item.fullName}</option>)}
      </select></label>{' '}
      <label>Hora <select value={time} onChange={event => setTime(event.target.value)} required disabled={!availability}>
        <option value="">Selecciona una hora</option>
        {slots.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
      </select></label>{' '}
      {error && <Notice $error role="alert">{error}</Notice>}
      {availability && !availability.schedule && <p>No hay atención ese día.</p>}
      <Button type="submit" disabled={busy || !date || !time}>{busy ? 'Enviando…' : 'Solicitar cambio'}</Button>
      <Button type="button" onClick={onCancel}>Cerrar</Button>
    </form>
  );
}

function ClientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState('');

  const load = useCallback(async () => {
    try {
      setAppointments(await apiGetAppointments());
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const cancel = async id => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    try {
      await apiUpdateAppointmentStatus(id, 'CANCELLED');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <Page>
      <Title>Mis citas</Title>
      <Description>Consulta el estado de tus reservas y cancela las que ya no necesites.</Description>
      {error && <Notice $error role="alert">{error}</Notice>}
      {loading ? <p role="status">Cargando citas…</p> : appointments.length === 0
        ? <p>Aún no tienes citas registradas.</p>
        : (
          <TableWrap><Table>
            <thead><tr><th>Servicio</th><th>Fecha</th><th>Hora</th><th>Estilista</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>{appointments.map(appointment => (
              <Fragment key={appointment._id}>
              <tr key={appointment._id}>
                <td>{appointment.service}</td><td>{appointment.date}</td><td>{appointment.time}</td>
                <td>{appointment.stylist || 'Por asignar'}</td>
                <td>{appointment.status === 'PENDING' ? 'Pendiente' : appointment.status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'}</td>
                <td>{appointment.status !== 'CANCELLED' && <>
                  <Button type="button" onClick={() => setReschedulingId(current => current === appointment._id ? '' : appointment._id)}>Reprogramar</Button>
                  <Button type="button" $danger onClick={() => cancel(appointment._id)}>Cancelar</Button>
                </>}</td>
              </tr>
              {reschedulingId === appointment._id && <tr key={`${appointment._id}-reschedule`}><td colSpan="6">
                <RescheduleForm appointment={appointment} onSaved={async () => { setReschedulingId(''); await load(); }} onCancel={() => setReschedulingId('')} />
                <p>El cambio quedará pendiente de confirmación.</p>
              </td></tr>}
              </Fragment>
            ))}</tbody>
          </Table></TableWrap>
        )}
    </Page>
  );
}

export default ClientAppointments;
