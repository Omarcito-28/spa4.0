// Utilidades de fechas ("YYYY-MM-DD") y horas ("h:mm AM|PM") de las citas.
export default class AppointmentTime {
  static #TIME_PATTERN = /^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;

  static isValidDate(date) {
    const parsedDate = new Date(`${date}T12:00:00Z`);
    return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
  }

  static isValidTime(time) {
    return AppointmentTime.#TIME_PATTERN.test(time);
  }

  static weekday(date) {
    return new Date(`${date}T12:00:00Z`).getUTCDay();
  }

  static addDays(date, days) {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + days);
    return next.toISOString().slice(0, 10);
  }

  static daysBetween(from, to) {
    return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
  }

  // Minutos que faltan desde "ahora" (fecha y minuto del día en Bogotá) hasta el inicio de la cita.
  static minutesUntil(date, time, today, minutesNow) {
    return AppointmentTime.daysBetween(today, date) * 1440 + AppointmentTime.toMinutes(time) - minutesNow;
  }

  static toMinutes(time) {
    const [, hour, minute, period] = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
    return ((Number(hour) % 12) + (period === 'PM' ? 12 : 0)) * 60 + Number(minute);
  }

  // "HH:mm" (24 h) de los horarios de trabajo.
  static clockToMinutes(clock) {
    const [hour, minute] = clock.split(':').map(Number);
    return hour * 60 + minute;
  }
}
