import { appointmentTimeToMinutes } from './date';

// Descarga un texto como archivo, sin pasar por el servidor.
export const downloadFile = (filename, content, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// ─── CALENDARIO (.ics) ───────────────────────────────────────────────────────

const BOGOTA_UTC_OFFSET_MINUTES = 5 * 60; // Colombia no usa horario de verano: UTC-5 todo el año.

const icsDate = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = text => String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Inicio y fin de la cita en UTC, a partir de la fecha y hora de Colombia.
export const appointmentInterval = ({ date, time, duration }) => {
  const start = new Date(Date.parse(`${date}T00:00:00Z`) +
    (appointmentTimeToMinutes(time) + BOGOTA_UTC_OFFSET_MINUTES) * 60000);
  return { start, end: new Date(start.getTime() + (duration || 60) * 60000) };
};

export const toIcs = (appointment, { stylistName = '', location = '' } = {}) => {
  const { start, end } = appointmentInterval(appointment);
  const details = [`Servicio: ${appointment.service}`, `Estilista: ${stylistName || appointment.stylist || 'Por asignar'}`];
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Essence De Toi//Citas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appointment._id}@essence-de-toi`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(`${appointment.service} - Essence De Toi`)}`,
    `DESCRIPTION:${icsText(details.join('\n'))}`,
    ...(location ? [`LOCATION:${icsText(location)}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(`Tu cita de ${appointment.service} es en 2 horas`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
};

export const downloadIcs = (appointment, options) =>
  downloadFile(`cita-${appointment.date}.ics`, toIcs(appointment, options), 'text/calendar;charset=utf-8');
