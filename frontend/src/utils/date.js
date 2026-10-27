export const todayInTimeZone = (timeZone = 'America/Bogota') => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const minutesNowInTimeZone = timeZone => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const value = type => Number(parts.find(part => part.type === type).value);
  return value('hour') * 60 + value('minute');
};

// Convierte "h:mm AM|PM" (formato de las citas) a minutos desde la medianoche.
export const appointmentTimeToMinutes = time => {
  const [, hour, minute, period] = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  return ((Number(hour) % 12) + (period === 'PM' ? 12 : 0)) * 60 + Number(minute);
};

// Tiempo transcurrido corto para "Actualizado hace X": 12 s, 3 min, 2 h.
export const formatElapsed = milliseconds => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)} h`;
};

// Minutos que faltan para que empiece la cita (negativo si ya empezó), con la hora de Colombia.
export const minutesUntilAppointment = ({ date, time }, timeZone = 'America/Bogota') => {
  const today = todayInTimeZone(timeZone);
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);
  return days * 1440 + appointmentTimeToMinutes(time) - minutesNowInTimeZone(timeZone);
};

// Misma regla que el backend: la cita empezó si su fecha y hora ya llegaron en Colombia.
export const hasAppointmentStarted = ({ date, time }, timeZone = 'America/Bogota') => {
  const today = todayInTimeZone(timeZone);
  return date < today || (date === today && appointmentTimeToMinutes(time) <= minutesNowInTimeZone(timeZone));
};
