import { afterEach, describe, expect, it, vi } from 'vitest';
import { appointmentTimeToMinutes, formatElapsed, hasAppointmentStarted, todayInTimeZone } from './date';

describe('todayInTimeZone', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve la fecha en formato YYYY-MM-DD', () => {
    expect(todayInTimeZone()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('usa la fecha de Bogotá aunque en UTC ya sea el día siguiente', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T04:59:00Z')); // 23:59 del 31 de diciembre en Bogotá
    expect(todayInTimeZone()).toBe('2029-12-31');
  });

  it('cambia de día a la medianoche de Bogotá', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T05:00:00Z'));
    expect(todayInTimeZone()).toBe('2030-01-01');
  });

  it('admite otra zona horaria', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-03-10T20:00:00Z'));
    expect(todayInTimeZone('Asia/Tokyo')).toBe('2030-03-11');
    expect(todayInTimeZone('UTC')).toBe('2030-03-10');
  });

  it('rellena con cero el mes y el día', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-02-05T15:00:00Z'));
    expect(todayInTimeZone()).toBe('2030-02-05');
  });
});

describe('appointmentTimeToMinutes', () => {
  it.each([
    ['12:00 AM', 0],
    ['9:15 AM', 555],
    ['12:30 PM', 750],
    ['11:59 PM', 1439]
  ])('convierte %s a %i minutos', (time, minutes) => {
    expect(appointmentTimeToMinutes(time)).toBe(minutes);
  });
});

describe('hasAppointmentStarted', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // 10:00 AM del lunes 7 de enero de 2030 en Bogotá.
  const atBogota = () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-07T15:00:00Z'));
  };

  it('considera iniciada una cita de un día anterior', () => {
    atBogota();
    expect(hasAppointmentStarted({ date: '2030-01-06', time: '6:00 PM' })).toBe(true);
  });

  it('considera iniciada una cita de hoy cuya hora ya llegó', () => {
    atBogota();
    expect(hasAppointmentStarted({ date: '2030-01-07', time: '10:00 AM' })).toBe(true);
    expect(hasAppointmentStarted({ date: '2030-01-07', time: '9:30 AM' })).toBe(true);
  });

  it('no considera iniciada una cita más tarde hoy ni en otro día futuro', () => {
    atBogota();
    expect(hasAppointmentStarted({ date: '2030-01-07', time: '10:01 AM' })).toBe(false);
    expect(hasAppointmentStarted({ date: '2030-01-08', time: '8:00 AM' })).toBe(false);
  });

  it('usa la hora de Colombia, no la del navegador', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-08T02:00:00Z')); // 9:00 PM del 7 en Bogotá
    expect(hasAppointmentStarted({ date: '2030-01-07', time: '8:30 PM' })).toBe(true);
    expect(hasAppointmentStarted({ date: '2030-01-08', time: '8:00 AM' })).toBe(false);
  });
});

describe('formatElapsed', () => {
  it.each([
    [-500, '0 s'],
    [0, '0 s'],
    [12900, '12 s'],
    [59999, '59 s'],
    [60000, '1 min'],
    [3599000, '59 min'],
    [7200000, '2 h'],
  ])('formatea %i ms como "%s"', (ms, text) => {
    expect(formatElapsed(ms)).toBe(text);
  });
});
