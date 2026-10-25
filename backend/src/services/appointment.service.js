import AppointmentTime from '../utils/appointment-time.js';
import AvailabilityService from './availability.service.js';
import { ForbiddenError, NotFoundError, BookingError, ValidationError } from '../errors/index.js';

export default class AppointmentService {
  static STATUSES = ['CONFIRMED', 'CANCELLED', 'PENDING', 'COMPLETED'];
  static #STATUS_MESSAGES = {
    CANCELLED: 'La cita fue cancelada.',
    COMPLETED: 'Tu cita fue marcada como completada. ¡Gracias por visitarnos!'
  };

  #appointments;
  #services;
  #users;
  #availability;
  #locks;
  #email;
  #clock;

  constructor({ appointmentModel, serviceModel, userModel, availabilityService, bookingLockService, emailService, clock }) {
    this.#appointments = appointmentModel;
    this.#services = serviceModel;
    this.#users = userModel;
    this.#availability = availabilityService;
    this.#locks = bookingLockService;
    this.#email = emailService;
    this.#clock = clock;
  }

  listFor(user) {
    if (user.role === 'ADMIN') {
      return this.#appointments.find().sort({ date: 1, time: 1 });
    }
    if (user.role === 'STYLIST') {
      return this.#appointments.find({ stylist: user.username.toLowerCase() }).sort({ date: 1, time: 1 });
    }
    return this.#appointments.find({ username: user.username.toLowerCase() }).sort({ createdAt: -1 });
  }

  async create(user, { service, date, time, notes, stylist = '' }) {
    if (!service || !date || !time) {
      throw new ValidationError('Servicio, fecha y hora son obligatorios.');
    }
    if (typeof service !== 'string' || typeof date !== 'string' || typeof time !== 'string' ||
        (stylist && typeof stylist !== 'string')) {
      throw new ValidationError('Los datos de la cita no son válidos.');
    }
    if (!AppointmentTime.isValidDate(date)) {
      throw new ValidationError('La fecha no es válida.');
    }
    const today = this.#clock.today();
    if (date < today) {
      throw new ValidationError('La fecha no puede estar en el pasado.');
    }
    if (service.trim().length > 120 || !AppointmentTime.isValidTime(time)) {
      throw new ValidationError('El servicio o la hora no son válidos.');
    }
    if (typeof notes === 'string' && notes.length > 1000) {
      throw new ValidationError('Las notas no pueden superar 1000 caracteres.');
    }
    const serviceRecord = await this.#services.findOne({ name: service.trim() });
    if (!serviceRecord) {
      throw new ValidationError('El servicio seleccionado no está disponible.');
    }
    if (date === today && AppointmentTime.toMinutes(time) <= this.#clock.minutesNow()) {
      throw new ValidationError('La hora de la cita ya pasó.');
    }
    const normalizedStylist = stylist.trim().toLowerCase();
    const appointmentData = {
      username: user.username.toLowerCase(),
      service: service.trim(),
      duration: serviceRecord.duration,
      price: serviceRecord.price,
      stylist: normalizedStylist,
      date,
      time,
      notes: typeof notes === 'string' ? notes.trim() : '',
      status: 'PENDING'
    };
    const session = await this.#appointments.startSession();
    let newAppointment;
    try {
      await session.withTransaction(async () => {
        await this.#locks.lock(session, [normalizedStylist]);
        await this.#availability.assertSlotAvailable({
          date,
          time,
          duration: serviceRecord.duration,
          stylist: normalizedStylist,
          session
        });
        [newAppointment] = await this.#appointments.create([appointmentData], { session });
      });
    } finally {
      await session.endSession();
    }
    this.#notify(newAppointment, 'Recibimos tu solicitud de cita. Está pendiente de confirmación del equipo.');
    return newAppointment;
  }

  async updateStatus(id, status, user) {
    if (!AppointmentService.STATUSES.includes(status)) {
      throw new ValidationError('El estado de la cita no es válido.');
    }
    return this.#change({
      id,
      changes: { status },
      user,
      reason: AppointmentService.#STATUS_MESSAGES[status] ?? 'La cita fue confirmada por el equipo.'
    });
  }

  async update(id, { status, stylist }, user) {
    if (status !== undefined && !AppointmentService.STATUSES.includes(status)) {
      throw new ValidationError('El estado de la cita no es válido.');
    }
    if (stylist !== undefined && (typeof stylist !== 'string' || stylist.length > 80)) {
      throw new ValidationError('El estilista no es válido.');
    }
    return this.#change({
      id,
      changes: { ...(status !== undefined ? { status } : {}), ...(stylist !== undefined ? { stylist } : {}) },
      user,
      reason: 'La cita fue actualizada por el equipo.'
    });
  }

  async reschedule(id, { date, time, stylist }, user) {
    if (typeof date !== 'string' || typeof time !== 'string' ||
        (stylist !== undefined && typeof stylist !== 'string')) {
      throw new ValidationError('La nueva fecha, hora o estilista no son válidos.');
    }
    if (!AppointmentTime.isValidDate(date) || !AppointmentTime.isValidTime(time)) {
      throw new ValidationError('La fecha u hora no son válidas.');
    }
    const today = this.#clock.today();
    if (date < today || (date === today && AppointmentTime.toMinutes(time) <= this.#clock.minutesNow())) {
      throw new ValidationError('Selecciona una fecha y hora futuras en Colombia.');
    }
    return this.#change({
      id,
      changes: {
        date,
        time,
        ...(stylist !== undefined ? { stylist } : {}),
        status: 'PENDING'
      },
      user,
      reschedule: true,
      reason: 'Tu solicitud de cambio de horario quedó pendiente de confirmación.'
    });
  }

  async delete(id) {
    const deleted = await this.#appointments.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundError('Cita no encontrada.');
  }

  async #change({ id, changes, user, reschedule = false, reason }) {
    const currentAppointment = await this.#appointments.findById(id);
    if (!currentAppointment) throw new NotFoundError('Cita no encontrada.');
    const session = await this.#appointments.startSession();
    let updated;
    let shouldNotify = false;
    try {
      await session.withTransaction(async () => {
        const appointment = await this.#appointments.findById(id).session(session);
        if (!appointment) throw new NotFoundError('Cita no encontrada.');
        this.#assertCanChange(appointment, changes, user, reschedule);

        const nextStylist = changes.stylist === undefined
          ? appointment.stylist
          : changes.stylist.trim().toLowerCase();
        await this.#locks.lock(session, [appointment.stylist, nextStylist]);
        const nextDate = changes.date || appointment.date;
        const nextTime = changes.time || appointment.time;
        const nextStatus = changes.status || appointment.status;
        if (AvailabilityService.ACTIVE_STATUSES.includes(nextStatus)) {
          await this.#availability.assertSlotAvailable({
            date: nextDate,
            time: nextTime,
            duration: appointment.duration || AvailabilityService.DEFAULT_DURATION,
            stylist: nextStylist,
            session,
            excludeId: appointment._id
          });
        }
        shouldNotify = appointment.status !== nextStatus ||
          appointment.stylist !== nextStylist ||
          appointment.date !== nextDate ||
          appointment.time !== nextTime;
        if (changes.status !== undefined) appointment.status = changes.status;
        if (changes.stylist !== undefined) appointment.stylist = nextStylist;
        if (changes.date !== undefined) appointment.date = changes.date;
        if (changes.time !== undefined) appointment.time = changes.time;
        if (reschedule) appointment.status = 'PENDING';
        await appointment.save({ session });
        updated = appointment;
      });
    } finally {
      await session.endSession();
    }
    if (reason && shouldNotify && updated) this.#notify(updated, reason);
    return updated;
  }

  #assertCanChange(appointment, changes, user, reschedule) {
    if (user.role === 'CLIENT' && appointment.username !== user.username.toLowerCase()) {
      throw new ForbiddenError('No autorizado para modificar esta cita.');
    }
    if (user.role === 'CLIENT' && !reschedule && changes.status !== 'CANCELLED') {
      throw new ForbiddenError('Solo puedes cancelar tus propias citas.');
    }
    if (user.role === 'STYLIST' && appointment.stylist !== user.username.toLowerCase()) {
      throw new ForbiddenError('No autorizado para modificar esta cita.');
    }
    // Una cita completada es definitiva: no se cancela, reprograma ni reasigna.
    if (appointment.status === 'COMPLETED') {
      throw new ValidationError('La cita ya fue completada y no se puede modificar.');
    }
    if (changes.status === 'COMPLETED') this.#assertCanComplete(appointment);
    if (user.role === 'CLIENT' && appointment.status === 'CANCELLED') {
      throw new BookingError('La cita ya fue cancelada.');
    }
    if (user.role === 'STYLIST' &&
        (appointment.stylist !== user.username.toLowerCase() ||
          changes.status === 'PENDING' || appointment.status === 'CANCELLED')) {
      throw new ForbiddenError('No autorizado para modificar esta cita.');
    }
    if (reschedule && appointment.status === 'CANCELLED') {
      throw new BookingError('No se puede reprogramar una cita cancelada.');
    }
  }

  // Los permisos (estilista asignado o ADMIN) ya se validaron en #assertCanChange.
  #assertCanComplete(appointment) {
    if (appointment.status !== 'CONFIRMED') {
      throw new ValidationError('Solo se puede completar una cita confirmada.');
    }
    const today = this.#clock.today();
    const hasStarted = appointment.date < today ||
      (appointment.date === today && AppointmentTime.toMinutes(appointment.time) <= this.#clock.minutesNow());
    if (!hasStarted) {
      throw new ValidationError('No puedes completar una cita que todavía no ha empezado.');
    }
  }

  // Se ejecuta en segundo plano: un fallo de correo nunca afecta la respuesta de la API.
  async #notify(appointment, message) {
    try {
      const customer = await this.#users.findOne({ username: appointment.username }).select('email');
      if (!customer?.email) {
        console.error(`No se pudo notificar la cita ${appointment._id}: el cliente no tiene correo.`);
        return;
      }
      await this.#email.sendBestEffort({
        to: customer.email,
        subject: 'Actualización de tu cita - Essence De Toi',
        text: `${message}\n\nServicio: ${appointment.service}\nFecha: ${appointment.date}\nHora: ${appointment.time}\nEstilista: ${appointment.stylist || 'Por asignar'}`
      });
    } catch (error) {
      console.error(`No se pudo preparar el correo de la cita ${appointment._id}: ${error.message}`);
    }
  }
}
