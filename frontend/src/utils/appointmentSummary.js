import { appointmentTimeToMinutes, hasAppointmentStarted } from './date';
import { isFinalStatus } from './appointmentStatus';

export const compareByDateTime = (a, b) =>
  a.date.localeCompare(b.date) || appointmentTimeToMinutes(a.time) - appointmentTimeToMinutes(b.time);

export const countByStatus = appointments => appointments.reduce(
  (counts, appointment) => ({ ...counts, [appointment.status]: (counts[appointment.status] || 0) + 1 }),
  { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 }
);

// Citas que siguen activas desde hoy en adelante, en orden cronológico.
export const upcomingAppointments = (appointments, today) => appointments
  .filter(appointment => appointment.date >= today && !isFinalStatus(appointment.status))
  .sort(compareByDateTime);

// Agenda de un día, sin las citas canceladas.
export const appointmentsOn = (appointments, date) => appointments
  .filter(appointment => appointment.date === date && appointment.status !== 'CANCELLED')
  .sort(compareByDateTime);

export const readyToComplete = appointments => appointments
  .filter(appointment => appointment.status === 'CONFIRMED' && hasAppointmentStarted(appointment))
  .sort(compareByDateTime);

export const unassignedAppointments = appointments => appointments
  .filter(appointment => !appointment.stylist && !isFinalStatus(appointment.status));

// Solicitudes pendientes, la más reciente primero.
export const recentRequests = (appointments, limit = 5) => appointments
  .filter(appointment => appointment.status === 'PENDING')
  .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  .slice(0, limit);
