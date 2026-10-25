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
