import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appointmentsOn,
  compareByDateTime,
  countByStatus,
  readyToComplete,
  recentRequests,
  unassignedAppointments,
  upcomingAppointments,
} from './appointmentSummary';

const item = (id, overrides) => ({ _id: id, date: '2030-01-07', time: '10:00 AM', status: 'PENDING', stylist: 'sofi', ...overrides });

describe('appointmentSummary', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ordena por fecha y por hora real, no alfabética', () => {
    const list = [item('c', { time: '1:00 PM' }), item('a', { date: '2030-01-06', time: '11:00 AM' }), item('b', { time: '9:00 AM' })];
    expect(list.sort(compareByDateTime).map(x => x._id)).toEqual(['a', 'b', 'c']);
  });

  it('cuenta las citas por estado', () => {
    const counts = countByStatus([item('1'), item('2', { status: 'COMPLETED' }), item('3', { status: 'COMPLETED' })]);
    expect(counts).toEqual({ PENDING: 1, CONFIRMED: 0, COMPLETED: 2, CANCELLED: 0, NO_SHOW: 0 });
  });

  it('las próximas citas excluyen las pasadas, canceladas y completadas', () => {
    const list = [
      item('pasada', { date: '2030-01-06' }),
      item('cancelada', { status: 'CANCELLED' }),
      item('hecha', { status: 'COMPLETED' }),
      item('tarde', { date: '2030-01-08' }),
      item('hoy', { status: 'CONFIRMED' }),
    ];
    expect(upcomingAppointments(list, '2030-01-07').map(x => x._id)).toEqual(['hoy', 'tarde']);
  });

  it('la agenda del día excluye las canceladas', () => {
    const list = [item('1', { time: '2:00 PM' }), item('2', { status: 'CANCELLED' }), item('3', { date: '2030-01-08' }), item('4')];
    expect(appointmentsOn(list, '2030-01-07').map(x => x._id)).toEqual(['4', '1']);
  });

  it('lista para completar solo las confirmadas que ya empezaron', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-07T16:00:00Z')); // 11:00 AM en Bogotá
    const list = [
      item('lista', { status: 'CONFIRMED' }),
      item('futura', { status: 'CONFIRMED', time: '3:00 PM' }),
      item('pendiente'),
    ];
    expect(readyToComplete(list).map(x => x._id)).toEqual(['lista']);
  });

  it('detecta las citas activas sin estilista', () => {
    const list = [item('1', { stylist: '' }), item('2', { stylist: '', status: 'CANCELLED' }), item('3')];
    expect(unassignedAppointments(list).map(x => x._id)).toEqual(['1']);
  });

  it('muestra primero las solicitudes pendientes más recientes', () => {
    const list = [
      item('vieja', { createdAt: '2030-01-01T10:00:00Z' }),
      item('nueva', { createdAt: '2030-01-03T10:00:00Z' }),
      item('confirmada', { status: 'CONFIRMED', createdAt: '2030-01-04T10:00:00Z' }),
      item('media', { createdAt: '2030-01-02T10:00:00Z' }),
    ];
    expect(recentRequests(list, 2).map(x => x._id)).toEqual(['nueva', 'media']);
  });
});
