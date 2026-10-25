// AppointmentService coordina transacciones y consultas de MongoDB, así que
// usa los modelos reales sobre el MongoDB en memoria; el correo y el reloj se
// simulan para que las pruebas no dependan de la red ni de la fecha actual.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import User from '../../src/models/user.model.js';
import Service from '../../src/models/service.model.js';
import Appointment from '../../src/models/appointment.model.js';
import BookingLock from '../../src/models/booking-lock.model.js';
import AppointmentService from '../../src/services/appointment.service.js';
import AvailabilityService from '../../src/services/availability.service.js';
import BookingLockService from '../../src/services/booking-lock.service.js';
import { BookingError, ForbiddenError, NotFoundError, ValidationError } from '../../src/errors/index.js';
import { connectTestDatabase, disconnectTestDatabase } from '../helpers/database.js';

const TODAY = '2030-01-01'; // martes
const MONDAY = '2030-01-07';
const SATURDAY = '2030-01-12';
const SUNDAY = '2030-01-06';

const ana = { id: 'ana-id', username: 'ana', role: 'CLIENT' };
const luis = { id: 'luis-id', username: 'luis', role: 'CLIENT' };
const sofi = { id: 'sofi-id', username: 'sofi', role: 'STYLIST' };
const admin = { id: 'admin-id', username: 'admin', role: 'ADMIN' };

// Sofi atiende de lunes a viernes de 10:00 a 16:00.
const sofiWeek = [0, 1, 2, 3, 4, 5, 6].map(day => ({ day, enabled: day >= 1 && day <= 5, start: '10:00', end: '16:00' }));

describe('AppointmentService', () => {
  let emailService;
  let clock;
  let availability;
  let appointments;

  beforeAll(async () => {
    await connectTestDatabase('appointments');
    await Promise.all([User.init(), Service.init(), Appointment.init(), BookingLock.init()]);
    await Service.create({ name: 'Corte para Dama', price: '$35.000', duration: 60 });
    await User.create([
      { username: 'ana', password: 'x', fullName: 'Ana', email: 'ana@x.co', role: 'CLIENT' },
      { username: 'luis', password: 'x', fullName: 'Luis', email: 'luis@x.co', role: 'CLIENT' },
      { username: 'sofi', password: 'x', fullName: 'Sofi', email: 'sofi@x.co', role: 'STYLIST', weeklySchedule: sofiWeek },
      { username: 'marta', password: 'x', fullName: 'Marta', email: 'marta@x.co', role: 'STYLIST' }
    ]);
  });

  afterAll(disconnectTestDatabase);

  beforeEach(async () => {
    await Appointment.deleteMany({});
    emailService = { sendBestEffort: vi.fn().mockResolvedValue(undefined) };
    clock = { today: () => TODAY, minutesNow: () => 10 * 60 }; // 10:00 AM en Bogotá
    const bookingLockService = new BookingLockService({ userModel: User, bookingLockModel: BookingLock });
    await bookingLockService.initialize();
    availability = new AvailabilityService({ userModel: User, appointmentModel: Appointment });
    appointments = new AppointmentService({
      appointmentModel: Appointment,
      serviceModel: Service,
      userModel: User,
      availabilityService: availability,
      bookingLockService,
      emailService,
      clock
    });
  });

  const book = (user, data) => appointments.create(user, { service: 'Corte para Dama', date: MONDAY, ...data });

  describe('crear cita', () => {
    it('crea una cita válida pendiente, con precio y duración del servicio', async () => {
      const created = await book(ana, { time: '10:00 AM', stylist: ' Sofi ', notes: '  Primera vez  ' });

      expect(created).toMatchObject({
        username: 'ana',
        service: 'Corte para Dama',
        stylist: 'sofi',
        date: MONDAY,
        time: '10:00 AM',
        duration: 60,
        price: '$35.000',
        notes: 'Primera vez',
        status: 'PENDING'
      });
      expect(await Appointment.countDocuments()).toBe(1);
      await vi.waitFor(() => expect(emailService.sendBestEffort).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'ana@x.co', subject: 'Actualización de tu cita - Essence De Toi' })
      ));
    });

    it('rechaza una fecha pasada', async () => {
      await expect(book(ana, { date: '2029-12-31', time: '10:00 AM' }))
        .rejects.toThrow(new ValidationError('La fecha no puede estar en el pasado.'));
    });

    it('rechaza una hora que ya pasó hoy', async () => {
      await expect(book(ana, { date: TODAY, time: '9:00 AM' }))
        .rejects.toThrow(new ValidationError('La hora de la cita ya pasó.'));
    });

    it.each([
      [{ service: '', time: '10:00 AM' }, 'Servicio, fecha y hora son obligatorios.'],
      [{ date: '2030-02-30', time: '10:00 AM' }, 'La fecha no es válida.'],
      [{ time: '25:00' }, 'El servicio o la hora no son válidos.'],
      [{ time: '10:00 AM', notes: 'x'.repeat(1001) }, 'Las notas no pueden superar 1000 caracteres.'],
      [{ service: 'Depilación', time: '10:00 AM' }, 'El servicio seleccionado no está disponible.']
    ])('valida los datos de entrada (%o)', async (data, message) => {
      await expect(book(ana, data)).rejects.toThrow(new ValidationError(message));
      expect(await Appointment.countDocuments()).toBe(0);
    });

    it('rechaza la misma hora para el mismo estilista', async () => {
      await book(ana, { time: '10:00 AM', stylist: 'sofi' });

      const error = await book(luis, { time: '10:00 AM', stylist: 'sofi' }).catch(e => e);
      expect(error).toBeInstanceOf(BookingError);
      expect(error.status).toBe(409);
      expect(error.message).toBe('Ese horario ya está reservado. Elige otro.');
    });

    it('rechaza una cita que se cruza parcialmente con otra del mismo estilista', async () => {
      await book(ana, { time: '11:00 AM', stylist: 'sofi' });

      await expect(book(luis, { time: '10:30 AM', stylist: 'sofi' })).rejects.toBeInstanceOf(BookingError);
      await expect(book(luis, { time: '11:30 AM', stylist: 'sofi' })).rejects.toBeInstanceOf(BookingError);
      await expect(book(luis, { time: '12:00 PM', stylist: 'sofi' })).resolves.toBeDefined();
    });

    it('permite la misma hora si la otra cita no tiene ese estilista', async () => {
      await book(ana, { time: '10:00 AM' });
      await expect(book(luis, { time: '10:00 AM', stylist: 'sofi' })).resolves.toBeDefined();
    });

    it.each([
      ['antes de que empiece su jornada', MONDAY, '9:00 AM'],
      ['cuando el servicio termina después de su jornada', MONDAY, '3:30 PM'],
      ['un sábado, día que no trabaja', SATURDAY, '11:00 AM']
    ])('rechaza al estilista %s', async (_case, date, time) => {
      await expect(book(ana, { date, time, stylist: 'sofi' }))
        .rejects.toThrow(new BookingError('El estilista no está disponible en ese horario.'));
    });

    it('rechaza horas fuera del horario general del spa', async () => {
      await expect(book(ana, { time: '7:00 PM' }))
        .rejects.toThrow(new BookingError('No se puede reservar fuera del horario de atención.'));
      await expect(book(ana, { date: SUNDAY, time: '10:00 AM' })).rejects.toBeInstanceOf(BookingError);
    });

    it('rechaza un estilista inexistente', async () => {
      await expect(book(ana, { time: '10:00 AM', stylist: 'pepe' }))
        .rejects.toThrow(new BookingError('El estilista seleccionado ya no está disponible.'));
    });
  });

  describe('reprogramar y cancelar', () => {
    it('reprograma a otro horario y vuelve a dejar la cita pendiente', async () => {
      const created = await book(ana, { time: '10:00 AM', stylist: 'sofi' });
      await appointments.updateStatus(created._id, 'CONFIRMED', sofi);

      const updated = await appointments.reschedule(created._id, { date: MONDAY, time: '2:00 PM' }, ana);

      expect(updated).toMatchObject({ time: '2:00 PM', status: 'PENDING', stylist: 'sofi' });
      const stored = await Appointment.findById(created._id);
      expect(stored.time).toBe('2:00 PM');
    });

    it('no reprograma sobre un horario ocupado', async () => {
      await book(luis, { time: '2:00 PM', stylist: 'sofi' });
      const created = await book(ana, { time: '10:00 AM', stylist: 'sofi' });

      await expect(appointments.reschedule(created._id, { date: MONDAY, time: '2:30 PM' }, ana))
        .rejects.toBeInstanceOf(BookingError);
    });

    it('no reprograma a una fecha u hora pasadas', async () => {
      const created = await book(ana, { time: '10:00 AM' });
      await expect(appointments.reschedule(created._id, { date: TODAY, time: '9:00 AM' }, ana))
        .rejects.toThrow(new ValidationError('Selecciona una fecha y hora futuras en Colombia.'));
    });

    it('el cliente cancela su cita y libera el horario', async () => {
      const created = await book(ana, { time: '10:00 AM', stylist: 'sofi' });

      const cancelled = await appointments.updateStatus(created._id, 'CANCELLED', ana);

      expect(cancelled.status).toBe('CANCELLED');
      await expect(book(luis, { time: '10:00 AM', stylist: 'sofi' })).resolves.toBeDefined();
    });

    it('no cancela dos veces ni reprograma una cita cancelada', async () => {
      const created = await book(ana, { time: '10:00 AM' });
      await appointments.updateStatus(created._id, 'CANCELLED', ana);

      await expect(appointments.updateStatus(created._id, 'CANCELLED', ana))
        .rejects.toThrow(new BookingError('La cita ya fue cancelada.'));
      await expect(appointments.reschedule(created._id, { date: MONDAY, time: '1:00 PM' }, ana))
        .rejects.toBeInstanceOf(BookingError);
    });

    it('responde 404 para una cita inexistente', async () => {
      await expect(appointments.updateStatus('0'.repeat(24), 'CANCELLED', ana)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('rechaza un estado desconocido', async () => {
      const created = await book(ana, { time: '10:00 AM' });
      await expect(appointments.updateStatus(created._id, 'TERMINADA', admin)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('permisos', () => {
    it('un cliente no puede cancelar ni reprogramar la cita de otro', async () => {
      const created = await book(ana, { time: '10:00 AM' });

      await expect(appointments.updateStatus(created._id, 'CANCELLED', luis))
        .rejects.toThrow(new ForbiddenError('No autorizado para modificar esta cita.'));
      await expect(appointments.reschedule(created._id, { date: MONDAY, time: '1:00 PM' }, luis))
        .rejects.toBeInstanceOf(ForbiddenError);
      expect((await Appointment.findById(created._id)).status).toBe('PENDING');
    });

    it('un cliente no puede confirmar su propia cita', async () => {
      const created = await book(ana, { time: '10:00 AM' });
      await expect(appointments.updateStatus(created._id, 'CONFIRMED', ana))
        .rejects.toThrow(new ForbiddenError('Solo puedes cancelar tus propias citas.'));
    });

    it('el estilista confirma sus citas pero no las de otros', async () => {
      const own = await book(ana, { time: '10:00 AM', stylist: 'sofi' });
      const unassigned = await book(luis, { time: '11:00 AM' });

      await expect(appointments.updateStatus(own._id, 'CONFIRMED', sofi)).resolves.toMatchObject({ status: 'CONFIRMED' });
      await expect(appointments.updateStatus(unassigned._id, 'CONFIRMED', sofi)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('cada rol ve solo las citas que le corresponden', async () => {
      await book(ana, { time: '10:00 AM', stylist: 'sofi' });
      await book(luis, { time: '11:00 AM' });

      expect((await appointments.listFor(ana)).map(a => a.username)).toEqual(['ana']);
      expect((await appointments.listFor(sofi)).map(a => a.stylist)).toEqual(['sofi']);
      expect(await appointments.listFor(admin)).toHaveLength(2);
    });

    it('el administrador reasigna el estilista validando su agenda', async () => {
      const created = await book(luis, { time: '11:00 AM' });

      const updated = await appointments.update(created._id, { stylist: 'Sofi' }, admin);
      expect(updated.stylist).toBe('sofi');
      await expect(appointments.update(created._id, { stylist: 5 }, admin)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('completar cita (COMPLETED)', () => {
    const marta = { id: 'marta-id', username: 'marta', role: 'STYLIST' };

    // Cita de Sofi confirmada para el lunes a las 10:00 AM; luego el reloj avanza a ese lunes.
    const confirmedAppointment = async () => {
      const created = await book(ana, { time: '10:00 AM', stylist: 'sofi' });
      await appointments.updateStatus(created._id, 'CONFIRMED', sofi);
      return created;
    };
    const setNow = (date, minutes) => {
      clock.today = () => date;
      clock.minutesNow = () => minutes;
    };

    it('el estilista asignado completa su cita confirmada ya iniciada', async () => {
      const created = await confirmedAppointment();
      setNow(MONDAY, 10 * 60 + 30);

      const completed = await appointments.updateStatus(created._id, 'COMPLETED', sofi);

      expect(completed.status).toBe('COMPLETED');
      expect((await Appointment.findById(created._id)).status).toBe('COMPLETED');
      await vi.waitFor(() => expect(emailService.sendBestEffort).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('marcada como completada') })
      ));
    });

    it('se puede completar justo a la hora de inicio y días después', async () => {
      const first = await confirmedAppointment();
      setNow(MONDAY, 10 * 60);
      await expect(appointments.updateStatus(first._id, 'COMPLETED', sofi)).resolves.toMatchObject({ status: 'COMPLETED' });

      setNow(TODAY, 10 * 60);
      const second = await book(luis, { time: '2:00 PM', stylist: 'sofi' });
      await appointments.updateStatus(second._id, 'CONFIRMED', sofi);
      setNow('2030-01-09', 8 * 60);
      await expect(appointments.updateStatus(second._id, 'COMPLETED', sofi)).resolves.toMatchObject({ status: 'COMPLETED' });
    });

    it('rechaza con 400 una cita que todavía no empieza', async () => {
      const created = await confirmedAppointment();
      setNow(MONDAY, 9 * 60 + 59);

      const error = await appointments.updateStatus(created._id, 'COMPLETED', sofi).catch(e => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.status).toBe(400);
      expect(error.message).toBe('No puedes completar una cita que todavía no ha empezado.');

      setNow(TODAY, 23 * 60);
      await expect(appointments.updateStatus(created._id, 'COMPLETED', sofi)).rejects.toBeInstanceOf(ValidationError);
    });

    it.each(['PENDING', 'CANCELLED'])('rechaza con 400 completar una cita %s', async status => {
      const created = await book(ana, { time: '10:00 AM', stylist: 'sofi' });
      if (status === 'CANCELLED') await appointments.updateStatus(created._id, 'CANCELLED', ana);
      setNow(MONDAY, 11 * 60);

      await expect(appointments.updateStatus(created._id, 'COMPLETED', admin))
        .rejects.toThrow(new ValidationError('Solo se puede completar una cita confirmada.'));
    });

    it('rechaza con 403 que otro estilista o el cliente la completen', async () => {
      const created = await confirmedAppointment();
      setNow(MONDAY, 11 * 60);

      const byOther = await appointments.updateStatus(created._id, 'COMPLETED', marta).catch(e => e);
      expect(byOther).toBeInstanceOf(ForbiddenError);
      expect(byOther.status).toBe(403);
      await expect(appointments.updateStatus(created._id, 'COMPLETED', ana)).rejects.toBeInstanceOf(ForbiddenError);
      expect((await Appointment.findById(created._id)).status).toBe('CONFIRMED');
    });

    it('el ADMIN puede completarla por estado o desde la edición', async () => {
      const first = await confirmedAppointment();
      const second = await book(luis, { time: '11:00 AM' });
      await appointments.update(second._id, { status: 'CONFIRMED' }, admin);
      setNow(MONDAY, 12 * 60);

      await expect(appointments.updateStatus(first._id, 'COMPLETED', admin)).resolves.toMatchObject({ status: 'COMPLETED' });
      await expect(appointments.update(second._id, { status: 'COMPLETED' }, admin)).resolves.toMatchObject({ status: 'COMPLETED' });
    });

    describe('una cita completada es definitiva', () => {
      let completed;

      beforeEach(async () => {
        completed = await confirmedAppointment();
        setNow(MONDAY, 11 * 60);
        await appointments.updateStatus(completed._id, 'COMPLETED', sofi);
      });

      it.each([
        ['el cliente la cancela', () => appointments.updateStatus(completed._id, 'CANCELLED', ana)],
        ['el estilista la cancela', () => appointments.updateStatus(completed._id, 'CANCELLED', sofi)],
        ['el ADMIN la cancela', () => appointments.update(completed._id, { status: 'CANCELLED' }, admin)],
        ['el ADMIN la vuelve a confirmar', () => appointments.update(completed._id, { status: 'CONFIRMED' }, admin)],
        ['el ADMIN cambia el estilista', () => appointments.update(completed._id, { stylist: 'marta' }, admin)],
        ['el cliente la reprograma', () => appointments.reschedule(completed._id, { date: '2030-01-08', time: '2:00 PM' }, ana)]
      ])('rechaza con 400 cuando %s', async (_case, action) => {
        await expect(action()).rejects.toThrow(new ValidationError('La cita ya fue completada y no se puede modificar.'));
        expect((await Appointment.findById(completed._id)).status).toBe('COMPLETED');
      });

      it('otro cliente sigue recibiendo 403, no 400', async () => {
        await expect(appointments.updateStatus(completed._id, 'CANCELLED', luis)).rejects.toBeInstanceOf(ForbiddenError);
      });

      it('el cliente la ve como completada', async () => {
        expect((await appointments.listFor(ana)).map(a => a.status)).toEqual(['COMPLETED']);
      });

      it('sigue ocupando su horario en la agenda del estilista', async () => {
        const { appointments: busy } = await availability.getAvailability(MONDAY, 'sofi');
        expect(busy.map(a => a.time)).toEqual(['10:00 AM']);
      });
    });
  });

  describe('AvailabilityService.getAvailability', () => {
    it('usa la jornada por defecto del spa sin estilista', async () => {
      await expect(availability.getAvailability(MONDAY)).resolves.toMatchObject({ schedule: { start: '09:00', end: '19:00' } });
      await expect(availability.getAvailability(SATURDAY)).resolves.toMatchObject({ schedule: { start: '09:00', end: '17:00' } });
      await expect(availability.getAvailability(SUNDAY)).resolves.toMatchObject({ schedule: null });
    });

    it('devuelve la jornada del estilista y sus horas ocupadas', async () => {
      await book(ana, { time: '10:00 AM', stylist: 'sofi' });

      const result = await availability.getAvailability(MONDAY, 'SOFI');
      expect(result.schedule).toEqual({ start: '10:00', end: '16:00' });
      expect(result.appointments.map(a => ({ time: a.time, duration: a.duration }))).toEqual([{ time: '10:00 AM', duration: 60 }]);
    });

    it('valida la fecha y el estilista', async () => {
      await expect(availability.getAvailability('2030-02-30')).rejects.toBeInstanceOf(ValidationError);
      await expect(availability.getAvailability(MONDAY, 'pepe'))
        .rejects.toThrow(new ValidationError('El estilista seleccionado no está disponible.'));
    });
  });
});
