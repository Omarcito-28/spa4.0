import { afterEach, describe, expect, it, vi } from 'vitest';
import AppointmentTime from '../../src/utils/appointment-time.js';
import BogotaClock from '../../src/utils/bogota-clock.js';

describe('AppointmentTime', () => {
  it.each(['2030-01-07', '2028-02-29', '2030-12-31'])('acepta la fecha válida %s', date => {
    expect(AppointmentTime.isValidDate(date)).toBe(true);
  });

  it.each(['2030-02-29', '2030-13-01', '2030-1-07', '07/01/2030', '', undefined, 20300107])(
    'rechaza la fecha inválida %s', date => {
      expect(AppointmentTime.isValidDate(date)).toBe(false);
    });

  it.each(['9:00 AM', '09:30 PM', '12:00 PM', '12:59 AM'])('acepta la hora %s', time => {
    expect(AppointmentTime.isValidTime(time)).toBe(true);
  });

  it.each(['13:00 PM', '0:30 AM', '9:60 AM', '9:00', '9:00 am', '21:00'])('rechaza la hora %s', time => {
    expect(AppointmentTime.isValidTime(time)).toBe(false);
  });

  it.each([
    ['12:00 AM', 0],
    ['9:15 AM', 555],
    ['12:30 PM', 750],
    ['1:15 PM', 795],
    ['11:59 PM', 1439]
  ])('convierte %s a %i minutos', (time, minutes) => {
    expect(AppointmentTime.toMinutes(time)).toBe(minutes);
  });

  it('convierte horas de jornada HH:mm a minutos', () => {
    expect(AppointmentTime.clockToMinutes('09:00')).toBe(540);
    expect(AppointmentTime.clockToMinutes('19:30')).toBe(1170);
  });

  it('calcula el día de la semana sin depender de la zona horaria del servidor', () => {
    expect(AppointmentTime.weekday('2030-01-06')).toBe(0); // domingo
    expect(AppointmentTime.weekday('2030-01-07')).toBe(1); // lunes
    expect(AppointmentTime.weekday('2030-01-12')).toBe(6); // sábado
  });
});

describe('BogotaClock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('usa la fecha de Colombia aunque en UTC ya sea el día siguiente', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-02T03:30:00Z')); // 22:30 del 1 de enero en Bogotá
    const clock = new BogotaClock();
    expect(clock.today()).toBe('2030-01-01');
    expect(clock.minutesNow()).toBe(22 * 60 + 30);
  });

  it('calcula los minutos de la mañana y del mediodía', () => {
    vi.useFakeTimers();
    const clock = new BogotaClock();
    vi.setSystemTime(new Date('2030-06-15T05:05:00Z')); // 00:05 en Bogotá
    expect(clock.minutesNow()).toBe(5);
    vi.setSystemTime(new Date('2030-06-15T17:00:00Z')); // 12:00 en Bogotá
    expect(clock.minutesNow()).toBe(720);
  });

  it('admite otra zona horaria', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T23:30:00Z'));
    expect(new BogotaClock('Asia/Tokyo').today()).toBe('2030-01-02');
  });
});
