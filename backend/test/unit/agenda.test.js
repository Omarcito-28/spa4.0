// Días libres y cierres, inasistencias, política de cancelación y recordatorios.
// Usan los modelos reales sobre el MongoDB en memoria; el reloj y el correo se simulan.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import User from '../../src/models/user.model.js';
import Service from '../../src/models/service.model.js';
import Appointment from '../../src/models/appointment.model.js';
import BookingLock from '../../src/models/booking-lock.model.js';
import TimeOff from '../../src/models/time-off.model.js';
import AppointmentService from '../../src/services/appointment.service.js';
import AvailabilityService from '../../src/services/availability.service.js';
import BookingLockService from '../../src/services/booking-lock.service.js';
import TimeOffService from '../../src/services/time-off.service.js';
import ReminderService from '../../src/services/reminder.service.js';
import { BookingError, ConflictError, ForbiddenError, ValidationError } from '../../src/errors/index.js';
import { connectTestDatabase, disconnectTestDatabase } from '../helpers/database.js';

const TODAY = '2030-01-01'; // martes
const MONDAY = '2030-01-07';
const TUESDAY = '2030-01-08';

const ana = { id: 'ana-id', username: 'ana', role: 'CLIENT' };
const sofi = { id: 'sofi-id', username: 'sofi', role: 'STYLIST' };
const marta = { id: 'marta-id', username: 'marta', role: 'STYLIST' };
const admin = { id: 'admin-id', username: 'admin', role: 'ADMIN' };

describe('Agenda', () => {
  let clock;
  let emailService;
  let timeOff;
  let availability;
  let appointments;

  const setNow = (date, minutes) => {
    clock.today = () => date;
    clock.minutesNow = () => minutes;
  };
  const book = (data) => appointments.create(ana, { service: 'Corte para Dama', date: MONDAY, time: '10:00 AM', stylist: 'sofi', ...data });
  const buildAppointments = (cancellationNoticeHours = 0) => new AppointmentService({
    appointmentModel: Appointment,
    serviceModel: Service,
    userModel: User,
    availabilityService: availability,
    bookingLockService: new BookingLockService({ userModel: User, bookingLockModel: BookingLock }),
    emailService,
    clock,
    cancellationNoticeHours
  });

  beforeAll(async () => {
    await connectTestDatabase('agenda');
    await Promise.all([User.init(), Service.init(), Appointment.init(), BookingLock.init(), TimeOff.init()]);
    await Service.create({ name: 'Corte para Dama', price: '$35.000', duration: 60 });
    await User.create([
      { username: 'ana', password: 'x', fullName: 'Ana Pérez', email: 'ana@x.co', role: 'CLIENT' },
      { username: 'sofi', password: 'x', fullName: 'Sofi Rojas', email: 'sofi@x.co', role: 'STYLIST' },
      { username: 'marta', password: 'x', fullName: 'Marta', email: 'marta@x.co', role: 'STYLIST' }
    ]);
    await new BookingLockService({ userModel: User, bookingLockModel: BookingLock }).initialize();
  });

  afterAll(disconnectTestDatabase);

  beforeEach(async () => {
    await Promise.all([Appointment.deleteMany({}), TimeOff.deleteMany({})]);
    clock = { today: () => TODAY, minutesNow: () => 10 * 60 };
    emailService = {
      isConfigured: vi.fn(() => true),
      send: vi.fn().mockResolvedValue(undefined),
      sendBestEffort: vi.fn().mockResolvedValue(undefined)
    };
    const bookingLockService = new BookingLockService({ userModel: User, bookingLockModel: BookingLock });
    timeOff = new TimeOffService({ timeOffModel: TimeOff, userModel: User, appointmentModel: Appointment, bookingLockService, clock });
    availability = new AvailabilityService({ userModel: User, appointmentModel: Appointment, timeOffService: timeOff });
    appointments = buildAppointments();
  });

  describe('días libres y cierres del spa', () => {
    it('el estilista bloquea sus fechas y ese día no se puede reservar con él', async () => {
      const block = await timeOff.create(sofi, { start: MONDAY, end: TUESDAY, reason: ' Vacaciones ', stylist: 'marta' });

      // Un estilista siempre bloquea su propia agenda, aunque envíe otro nombre.
      expect(block).toMatchObject({ stylist: 'sofi', start: MONDAY, end: TUESDAY, reason: 'Vacaciones', createdBy: 'sofi' });
      await expect(availability.getAvailability(TUESDAY, 'sofi')).resolves.toMatchObject({
        schedule: null,
        closedReason: 'El estilista no atiende ese día (Vacaciones).'
      });
      await expect(book({})).rejects.toThrow(new BookingError('El estilista no atiende ese día (Vacaciones).'));
      // Los demás estilistas siguen disponibles.
      await expect(book({ stylist: 'marta' })).resolves.toMatchObject({ stylist: 'marta' });
    });

    it('un cierre del spa bloquea a todos y a las citas sin estilista', async () => {
      await timeOff.create(admin, { start: MONDAY, end: MONDAY, reason: 'Festivo' });

      await expect(availability.getAvailability(MONDAY)).resolves.toMatchObject({
        schedule: null, closedReason: 'El spa estará cerrado ese día (Festivo).'
      });
      await expect(availability.getAvailability(MONDAY, 'marta')).resolves.toMatchObject({ schedule: null });
      await expect(book({ stylist: '' })).rejects.toBeInstanceOf(BookingError);
      await expect(availability.getAvailability(TUESDAY, 'marta')).resolves.toMatchObject({ schedule: { start: '09:00', end: '19:00' } });
    });

    it('no bloquea fechas con citas activas, pero sí si la cita fue cancelada', async () => {
      const created = await book({});
      await expect(timeOff.create(sofi, { start: MONDAY, end: MONDAY }))
        .rejects.toThrow(new ConflictError('Hay 1 cita activa en esas fechas. Reasígnalas o cancélalas antes de bloquear la agenda.'));
      await expect(timeOff.create(admin, { start: MONDAY, end: MONDAY })).rejects.toBeInstanceOf(ConflictError);

      await appointments.updateStatus(created._id, 'CANCELLED', ana);
      await expect(timeOff.create(sofi, { start: MONDAY, end: MONDAY })).resolves.toMatchObject({ stylist: 'sofi' });
    });

    it('valida fechas, cruces y el estilista elegido', async () => {
      await expect(timeOff.create(sofi, { start: TUESDAY, end: MONDAY })).rejects.toBeInstanceOf(ValidationError);
      await expect(timeOff.create(sofi, { start: '2029-12-31', end: MONDAY })).rejects.toThrow('No puedes bloquear fechas pasadas.');
      await expect(timeOff.create(sofi, { start: '2030-02-30', end: '2030-03-01' })).rejects.toBeInstanceOf(ValidationError);
      await expect(timeOff.create(sofi, { start: MONDAY, end: '2031-02-01' })).rejects.toThrow('Un bloqueo no puede durar más de un año.');
      await expect(timeOff.create(admin, { stylist: 'ana', start: MONDAY, end: MONDAY }))
        .rejects.toThrow('El estilista seleccionado no está disponible.');

      await timeOff.create(sofi, { start: MONDAY, end: TUESDAY });
      await expect(timeOff.create(admin, { stylist: 'sofi', start: TUESDAY, end: '2030-01-09' }))
        .rejects.toThrow('Ya hay un bloqueo de este estilista que se cruza con esas fechas.');
    });

    it('cada estilista ve sus bloqueos y los del spa; solo quita los suyos', async () => {
      const own = await timeOff.create(sofi, { start: MONDAY, end: MONDAY });
      const other = await timeOff.create(marta, { start: MONDAY, end: MONDAY });
      const closure = await timeOff.create(admin, { start: '2030-01-10', end: '2030-01-10' });

      expect((await timeOff.list(sofi)).map(item => item.id)).toEqual([own.id, closure.id]);
      expect(await timeOff.list(admin)).toHaveLength(3);
      await expect(timeOff.delete(other._id, sofi)).rejects.toBeInstanceOf(ForbiddenError);
      await expect(timeOff.delete(closure._id, sofi)).rejects.toBeInstanceOf(ForbiddenError);
      await timeOff.delete(own._id, sofi);
      await timeOff.delete(other._id, admin);
      expect(await TimeOff.countDocuments()).toBe(1);
    });

    it('la lista omite los bloqueos que ya terminaron', async () => {
      await timeOff.create(sofi, { start: MONDAY, end: MONDAY });
      setNow(TUESDAY, 8 * 60);
      await expect(timeOff.list(sofi)).resolves.toEqual([]);
    });
  });

  describe('inasistencia (NO_SHOW)', () => {
    it('el estilista la registra cuando la hora de la cita ya pasó, y queda definitiva', async () => {
      const created = await book({});
      setNow(MONDAY, 9 * 60);
      await expect(appointments.updateStatus(created._id, 'NO_SHOW', sofi))
        .rejects.toThrow('No puedes registrar una inasistencia antes de la hora de la cita.');

      setNow(MONDAY, 10 * 60 + 20);
      await expect(appointments.updateStatus(created._id, 'NO_SHOW', sofi)).resolves.toMatchObject({ status: 'NO_SHOW' });
      await vi.waitFor(() => expect(emailService.sendBestEffort).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('no asististe') })
      ));
      await expect(appointments.updateStatus(created._id, 'CONFIRMED', admin))
        .rejects.toThrow('La cita se registró como inasistencia y no se puede modificar.');
    });

    it('el cliente y otro estilista no pueden registrarla', async () => {
      const created = await book({});
      setNow(MONDAY, 11 * 60);
      await expect(appointments.updateStatus(created._id, 'NO_SHOW', ana)).rejects.toBeInstanceOf(ForbiddenError);
      await expect(appointments.updateStatus(created._id, 'NO_SHOW', marta)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('no aplica a citas canceladas', async () => {
      const created = await book({});
      await appointments.updateStatus(created._id, 'CANCELLED', ana);
      setNow(MONDAY, 11 * 60);
      await expect(appointments.updateStatus(created._id, 'NO_SHOW', admin))
        .rejects.toThrow('Solo se puede registrar la inasistencia de una cita pendiente o confirmada.');
    });
  });

  describe('edición del administrador', () => {
    it('cambia fecha y hora validando la agenda y conserva el estado', async () => {
      const created = await book({});
      await appointments.updateStatus(created._id, 'CONFIRMED', sofi);
      await book({ time: '2:00 PM', date: TUESDAY });

      await expect(appointments.update(created._id, { date: TUESDAY, time: '2:00 PM' }, admin)).rejects.toBeInstanceOf(BookingError);
      await expect(appointments.update(created._id, { date: '2029-12-31', time: '2:00 PM' }, admin))
        .rejects.toThrow('Selecciona una fecha y hora futuras en Colombia.');
      await expect(appointments.update(created._id, { date: TUESDAY }, admin)).rejects.toBeInstanceOf(ValidationError);

      const moved = await appointments.update(created._id, { date: TUESDAY, time: '4:00 PM' }, admin);
      expect(moved).toMatchObject({ date: TUESDAY, time: '4:00 PM', status: 'CONFIRMED' });
    });
  });

  describe('política de cancelación', () => {
    beforeEach(() => {
      appointments = buildAppointments(24);
    });

    it('expone las horas configuradas', () => {
      expect(appointments.getPolicy()).toEqual({ cancellationNoticeHours: 24 });
    });

    it('el cliente cancela o reprograma solo con la anticipación mínima', async () => {
      const created = await book({});
      setNow('2030-01-06', 10 * 60); // exactamente 24 h antes
      await expect(appointments.reschedule(created._id, { date: MONDAY, time: '11:00 AM' }, ana))
        .resolves.toMatchObject({ time: '11:00 AM' });

      setNow('2030-01-06', 11 * 60 + 1); // 23 h 59 min antes de las 11:00
      await expect(appointments.updateStatus(created._id, 'CANCELLED', ana)).rejects.toThrow(
        'Solo puedes cancelar o reprogramar con al menos 24 horas de anticipación. Comunícate con el spa para cualquier cambio.');
      await expect(appointments.reschedule(created._id, { date: TUESDAY, time: '11:00 AM' }, ana))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('el equipo del spa no tiene ese límite', async () => {
      const created = await book({});
      setNow(MONDAY, 9 * 60);
      await expect(appointments.updateStatus(created._id, 'CANCELLED', sofi)).resolves.toMatchObject({ status: 'CANCELLED' });
    });
  });

  describe('recordatorios del día anterior', () => {
    let reminders;

    beforeEach(() => {
      reminders = new ReminderService({ appointmentModel: Appointment, userModel: User, emailService, clock });
    });

    it('envía un recordatorio por cada cita activa de mañana, una sola vez', async () => {
      const confirmed = await book({});
      await appointments.updateStatus(confirmed._id, 'CONFIRMED', sofi);
      await book({ time: '2:00 PM', stylist: '' });
      const cancelled = await book({ time: '3:00 PM' });
      await appointments.updateStatus(cancelled._id, 'CANCELLED', ana);
      await book({ date: TUESDAY });

      setNow('2030-01-06', 8 * 60);
      await expect(reminders.sendDueReminders()).resolves.toEqual({ sent: 2 });
      expect(emailService.send).toHaveBeenCalledTimes(2);
      expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
        to: 'ana@x.co',
        subject: 'Recordatorio: tu cita es mañana - Essence De Toi',
        text: expect.stringContaining('Estilista: Sofi Rojas')
      }));
      expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
        text: expect.stringContaining('pendiente de confirmación')
      }));

      await expect(reminders.sendDueReminders()).resolves.toEqual({ sent: 0 });
    });

    it('reintenta si el correo falla y vuelve a avisar si la cita se reprograma', async () => {
      const created = await book({});
      setNow('2030-01-06', 8 * 60);
      emailService.send.mockRejectedValueOnce(new Error('SMTP caído'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(reminders.sendDueReminders()).resolves.toEqual({ sent: 0 });
      await expect(reminders.sendDueReminders()).resolves.toEqual({ sent: 1 });

      setNow(TODAY, 10 * 60);
      await appointments.reschedule(created._id, { date: TUESDAY, time: '10:00 AM' }, ana);
      setNow(MONDAY, 8 * 60);
      await expect(reminders.sendDueReminders()).resolves.toEqual({ sent: 1 });
    });

    it('no hace nada sin correo configurado', async () => {
      emailService.isConfigured.mockReturnValue(false);
      await book({});
      setNow('2030-01-06', 8 * 60);
      await expect(reminders.sendDueReminders()).resolves.toEqual({ sent: 0, skipped: 'Correo no configurado.' });
    });
  });
});
