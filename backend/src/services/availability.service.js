import AppointmentTime from '../utils/appointment-time.js';
import { BookingError, ValidationError } from '../errors/index.js';

// Horarios de atención, agenda de estilistas y detección de cruces de citas.
export default class AvailabilityService {
  static ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'];
  // Una cita completada ya ocupó su horario: tampoco se puede reservar encima.
  static OCCUPYING_STATUSES = [...AvailabilityService.ACTIVE_STATUSES, 'COMPLETED'];
  static DEFAULT_DURATION = 60;

  #users;
  #appointments;

  constructor({ userModel, appointmentModel }) {
    this.#users = userModel;
    this.#appointments = appointmentModel;
  }

  async getAvailability(date, stylist) {
    if (!AppointmentTime.isValidDate(date) || (stylist !== undefined && typeof stylist !== 'string')) {
      throw new ValidationError('La fecha o el estilista no son válidos.');
    }

    const weekday = AppointmentTime.weekday(date);
    let normalizedStylist = '';
    let schedule = this.#defaultWorkday(weekday);
    if (stylist?.trim()) {
      const stylistUser = await this.#users.findOne({
        username: stylist.trim().toLowerCase(),
        role: 'STYLIST',
        isActive: { $ne: false }
      }).select('username weeklySchedule');
      if (!stylistUser) {
        throw new ValidationError('El estilista seleccionado no está disponible.');
      }
      normalizedStylist = stylistUser.username;
      schedule = this.#workdayOf(stylistUser, weekday);
    }

    const appointments = await this.#appointments.find({
      date,
      stylist: normalizedStylist,
      status: { $in: AvailabilityService.OCCUPYING_STATUSES }
    }).select('time duration -_id');
    return { schedule: schedule?.enabled ? { start: schedule.start, end: schedule.end } : null, appointments };
  }

  // Lanza BookingError si el horario está fuera de la jornada o se cruza con otra cita.
  async assertSlotAvailable({ date, time, duration, stylist, session, excludeId }) {
    const weekday = AppointmentTime.weekday(date);
    let schedule = this.#defaultWorkday(weekday);
    if (stylist) {
      const stylistUser = await this.#users.findOne({
        username: stylist,
        role: 'STYLIST',
        isActive: { $ne: false }
      }).session(session);
      if (!stylistUser) throw new BookingError('El estilista seleccionado ya no está disponible.');
      schedule = this.#workdayOf(stylistUser, weekday);
    }
    if (!schedule?.enabled || !this.#isWithinSchedule(time, schedule.start, schedule.end, duration)) {
      throw new BookingError(stylist
        ? 'El estilista no está disponible en ese horario.'
        : 'No se puede reservar fuera del horario de atención.');
    }
    const query = {
      date,
      stylist,
      status: { $in: AvailabilityService.OCCUPYING_STATUSES },
      ...(excludeId ? { _id: { $ne: excludeId } } : {})
    };
    const appointments = await this.#appointments.find(query).select('time duration').session(session);
    if (appointments.some(item =>
      this.#overlaps(time, duration, item.time, item.duration || AvailabilityService.DEFAULT_DURATION))) {
      throw new BookingError('Ese horario ya está reservado. Elige otro.');
    }
  }

  // Un estilista sin horario configurado trabaja en la jornada por defecto del spa.
  #workdayOf(stylistUser, weekday) {
    if (!stylistUser.weeklySchedule.length) return this.#defaultWorkday(weekday);
    return stylistUser.weeklySchedule.find(day => day.day === weekday);
  }

  #defaultWorkday(weekday) {
    if (weekday === 0) return null;
    return { enabled: true, start: '09:00', end: weekday === 6 ? '17:00' : '19:00' };
  }

  #isWithinSchedule(time, start, end, duration) {
    const startMinutes = AppointmentTime.toMinutes(time);
    return startMinutes >= AppointmentTime.clockToMinutes(start) &&
      startMinutes + duration <= AppointmentTime.clockToMinutes(end);
  }

  #overlaps(startA, durationA, startB, durationB) {
    const a = AppointmentTime.toMinutes(startA);
    const b = AppointmentTime.toMinutes(startB);
    return a < b + durationB && b < a + durationA;
  }
}
