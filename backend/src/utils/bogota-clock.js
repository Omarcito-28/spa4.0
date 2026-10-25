// Reloj de la zona horaria del spa (America/Bogota).
export default class BogotaClock {
  #timeZone;

  constructor(timeZone = 'America/Bogota') {
    this.#timeZone = timeZone;
  }

  today() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.#timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  minutesNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.#timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).formatToParts(new Date());
    const hour = Number(parts.find(part => part.type === 'hour').value);
    const minute = Number(parts.find(part => part.type === 'minute').value);
    const period = parts.find(part => part.type === 'dayPeriod').value;
    return ((hour % 12) + (period === 'PM' ? 12 : 0)) * 60 + minute;
  }
}
