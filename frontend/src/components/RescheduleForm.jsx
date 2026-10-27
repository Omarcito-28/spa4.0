import { useEffect, useState } from 'react';
import { apiGetStylistAvailability, apiGetStylists } from '../services/api';
import { todayInTimeZone } from '../utils/date';
import { Button, InlineForm, Notice } from './ManagementUI';

const formatTime = minutes => {
  const hour = Math.floor(minutes / 60);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

// Fecha, estilista y hora libres para mover una cita. `onSubmit` hace la petición
// (el cliente solicita un cambio; el administrador lo aplica directamente).
function RescheduleForm({ appointment, onSubmit, onSaved, onCancel, submitLabel = 'Solicitar cambio' }) {
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
      await onSubmit({ date, time, stylist });
      await onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <InlineForm onSubmit={submit}>
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
      {availability && !availability.schedule && <p>{availability.closedReason || 'No hay atención ese día.'}</p>}
      <Button type="submit" disabled={busy || !date || !time}>{busy ? 'Enviando…' : submitLabel}</Button>
      <Button type="button" $secondary onClick={onCancel}>Cerrar</Button>
    </InlineForm>
  );
}

export default RescheduleForm;
