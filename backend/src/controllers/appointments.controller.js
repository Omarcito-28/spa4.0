import Appointment from '../models/appointment.model.js';
import Service from '../models/service.model.js';
import User from '../models/user.model.js';
import { lockBookingResources } from '../utils/booking-locks.js';
import { sendEmailBestEffort } from '../services/email.service.js';

export const getAppointments = async (req, res) => {
  try {
    let appointments;
    if (req.user.role === 'ADMIN') {
      appointments = await Appointment.find().sort({ date: 1, time: 1 });
    } else if (req.user.role === 'STYLIST') {
      appointments = await Appointment.find({ stylist: req.user.username.toLowerCase() }).sort({ date: 1, time: 1 });
    } else {
      appointments = await Appointment.find({ username: req.user.username.toLowerCase() }).sort({ createdAt: -1 });
    }
    res.json(appointments);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getStylistAvailability = async (req, res) => {
  try {
    const { date, stylist } = req.query;
    const parsedDate = new Date(`${date}T12:00:00Z`);
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date ||
        (stylist !== undefined && typeof stylist !== 'string')) {
      return res.status(400).json({ error: 'La fecha o el estilista no son válidos.' });
    }

    let normalizedStylist = '';
    let schedule = defaultWorkday(parsedDate.getUTCDay());
    if (stylist?.trim()) {
      const stylistUser = await User.findOne({
        username: stylist.trim().toLowerCase(),
        role: 'STYLIST',
        isActive: { $ne: false }
      }).select('username weeklySchedule');
      if (!stylistUser) {
        return res.status(400).json({ error: 'El estilista seleccionado no está disponible.' });
      }
      normalizedStylist = stylistUser.username;
      const workday = stylistUser.weeklySchedule.find(day => day.day === parsedDate.getUTCDay());
      schedule = stylistUser.weeklySchedule.length ? workday : defaultWorkday(parsedDate.getUTCDay());
    }

    const appointments = await Appointment.find({
      date,
      stylist: normalizedStylist,
      status: { $in: ['PENDING', 'CONFIRMED'] }
    }).select('time duration -_id');
    res.json({ schedule: schedule?.enabled ? { start: schedule.start, end: schedule.end } : null, appointments });
  } catch {
    res.status(500).json({ error: 'No se pudo consultar la disponibilidad.' });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { service, date, time, notes, stylist = '' } = req.body;
    if (!service || !date || !time) {
      return res.status(400).json({ error: 'Servicio, fecha y hora son obligatorios.' });
    }
    if (typeof service !== 'string' || typeof date !== 'string' || typeof time !== 'string' ||
        (stylist && typeof stylist !== 'string')) {
      return res.status(400).json({ error: 'Los datos de la cita no son válidos.' });
    }
    const parsedDate = new Date(`${date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ error: 'La fecha no es válida.' });
    }
    const bogotaNow = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    if (date < bogotaNow) {
      return res.status(400).json({ error: 'La fecha no puede estar en el pasado.' });
    }
    if (service.trim().length > 120 || !/^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/.test(time)) {
      return res.status(400).json({ error: 'El servicio o la hora no son válidos.' });
    }
    if (typeof notes === 'string' && notes.length > 1000) {
      return res.status(400).json({ error: 'Las notas no pueden superar 1000 caracteres.' });
    }
    const serviceRecord = await Service.findOne({ name: service.trim() });
    if (!serviceRecord) {
      return res.status(400).json({ error: 'El servicio seleccionado no está disponible.' });
    }
    if (date === bogotaNow && appointmentMinutes(time) <= bogotaTimeInMinutes()) {
      return res.status(400).json({ error: 'La hora de la cita ya pasó.' });
    }
    const normalizedStylist = stylist.trim().toLowerCase();
    const appointmentData = {
      username: req.user.username.toLowerCase(),
      service: service.trim(),
      duration: serviceRecord.duration,
      price: serviceRecord.price,
      stylist: normalizedStylist,
      date,
      time,
      notes: typeof notes === 'string' ? notes.trim() : '',
      status: 'PENDING'
    };
    const session = await Appointment.startSession();
    let newAppointment;
    try {
      await session.withTransaction(async () => {
        await lockBookingResources(session, [normalizedStylist]);
        const validationError = await validateBookingSlot({
          date,
          time,
          duration: serviceRecord.duration,
          stylist: normalizedStylist,
          session
        });
        if (validationError) throw new BookingError(validationError, 409);
        [newAppointment] = await Appointment.create([appointmentData], { session });
      });
    } catch (error) {
      if (error instanceof BookingError) {
        return res.status(error.status).json({ error: error.message });
      }
      throw error;
    } finally {
      await session.endSession();
    }
    notifyAppointment(newAppointment, 'Recibimos tu solicitud de cita. Está pendiente de confirmación del equipo.');
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('No se pudo crear la cita:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const appointmentMinutes = time => {
  const [, hour, minute, period] = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  return ((Number(hour) % 12) + (period === 'PM' ? 12 : 0)) * 60 + Number(minute);
};

const isWithinSchedule = (time, start, end, duration) => {
  const startMinutes = appointmentMinutes(time);
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  return startMinutes >= startHour * 60 + startMinute &&
    startMinutes + duration <= endHour * 60 + endMinute;
};

const overlaps = (startA, durationA, startB, durationB) => {
  const a = appointmentMinutes(startA);
  const b = appointmentMinutes(startB);
  return a < b + durationB && b < a + durationA;
};

const bogotaTimeInMinutes = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).formatToParts(new Date());
  const hour = Number(parts.find(part => part.type === 'hour').value);
  const minute = Number(parts.find(part => part.type === 'minute').value);
  const period = parts.find(part => part.type === 'dayPeriod').value;
  return ((hour % 12) + (period === 'PM' ? 12 : 0)) * 60 + minute;
};

const defaultWorkday = day => {
  if (day === 0) return null;
  return { enabled: true, start: '09:00', end: day === 6 ? '17:00' : '19:00' };
};

class BookingError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const validateBookingSlot = async ({ date, time, duration, stylist, session, excludeId }) => {
  let schedule = defaultWorkday(new Date(`${date}T12:00:00Z`).getUTCDay());
  if (stylist) {
    const stylistUser = await User.findOne({
      username: stylist,
      role: 'STYLIST',
      isActive: { $ne: false }
    }).session(session);
    if (!stylistUser) return 'El estilista seleccionado ya no está disponible.';
    const workday = stylistUser.weeklySchedule.find(day =>
      day.day === new Date(`${date}T12:00:00Z`).getUTCDay());
    schedule = stylistUser.weeklySchedule.length ? workday : schedule;
  }
  if (!schedule?.enabled || !isWithinSchedule(time, schedule.start, schedule.end, duration)) {
    return stylist
      ? 'El estilista no está disponible en ese horario.'
      : 'No se puede reservar fuera del horario de atención.';
  }
  const query = {
    date,
    stylist,
    status: { $in: ['PENDING', 'CONFIRMED'] },
    ...(excludeId ? { _id: { $ne: excludeId } } : {})
  };
  const appointments = await Appointment.find(query).select('time duration').session(session);
  if (appointments.some(item => overlaps(time, duration, item.time, item.duration || 60))) {
    return 'Ese horario ya está reservado. Elige otro.';
  }
  return '';
};

const notifyAppointment = async (appointment, message) => {
  try {
    const customer = await User.findOne({ username: appointment.username }).select('email');
    if (!customer?.email) {
      console.error(`No se pudo notificar la cita ${appointment._id}: el cliente no tiene correo.`);
      return;
    }
    await sendEmailBestEffort({
      to: customer.email,
      subject: 'Actualización de tu cita - Essence De Toi',
      text: `${message}\n\nServicio: ${appointment.service}\nFecha: ${appointment.date}\nHora: ${appointment.time}\nEstilista: ${appointment.stylist || 'Por asignar'}`
    });
  } catch (error) {
    console.error(`No se pudo preparar el correo de la cita ${appointment._id}: ${error.message}`);
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['CONFIRMED', 'CANCELLED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'El estado de la cita no es válido.' });
    }
    const appointment = await changeAppointment({
      id,
      changes: { status },
      user: req.user,
      reason: status === 'CANCELLED' ? 'La cita fue cancelada.' : 'La cita fue confirmada por el equipo.'
    });
    res.json(appointment);
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
    console.error('No se pudo cambiar el estado de la cita:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { status, stylist } = req.body;
    if (status !== undefined && !['CONFIRMED', 'CANCELLED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'El estado de la cita no es válido.' });
    }
    if (stylist !== undefined && (typeof stylist !== 'string' || stylist.length > 80)) {
      return res.status(400).json({ error: 'El estilista no es válido.' });
    }
    const appointment = await changeAppointment({
      id: req.params.id,
      changes: { ...(status !== undefined ? { status } : {}), ...(stylist !== undefined ? { stylist } : {}) },
      user: req.user,
      reason: 'La cita fue actualizada por el equipo.'
    });
    res.json(appointment);
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
    console.error('No se pudo actualizar la cita:', error.message);
    res.status(500).json({ error: 'No se pudo actualizar la cita.' });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { date, time, stylist } = req.body;
    if (typeof date !== 'string' || typeof time !== 'string' ||
        (stylist !== undefined && typeof stylist !== 'string')) {
      return res.status(400).json({ error: 'La nueva fecha, hora o estilista no son válidos.' });
    }
    const parsedDate = new Date(`${date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date ||
        !/^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/.test(time)) {
      return res.status(400).json({ error: 'La fecha u hora no son válidas.' });
    }
    const bogotaNow = getBogotaDate();
    if (date < bogotaNow || (date === bogotaNow && appointmentMinutes(time) <= bogotaTimeInMinutes())) {
      return res.status(400).json({ error: 'Selecciona una fecha y hora futuras en Colombia.' });
    }
    const appointment = await changeAppointment({
      id: req.params.id,
      changes: {
        date,
        time,
        ...(stylist !== undefined ? { stylist } : {}),
        status: 'PENDING'
      },
      user: req.user,
      reschedule: true,
      reason: 'Tu solicitud de cambio de horario quedó pendiente de confirmación.'
    });
    res.json(appointment);
  } catch (error) {
    if (error instanceof BookingError) return res.status(error.status).json({ error: error.message });
    console.error('No se pudo reprogramar la cita:', error.message);
    res.status(500).json({ error: 'No se pudo reprogramar la cita.' });
  }
};

const changeAppointment = async ({ id, changes, user, reschedule = false, reason }) => {
  const currentAppointment = await Appointment.findById(id);
  if (!currentAppointment) throw new BookingError('Cita no encontrada.', 404);
  const session = await Appointment.startSession();
  let updated;
  let shouldNotify = false;
  try {
    await session.withTransaction(async () => {
      const appointment = await Appointment.findById(id).session(session);
      if (!appointment) throw new BookingError('Cita no encontrada.', 404);
      if (user.role === 'CLIENT' && appointment.username !== user.username.toLowerCase()) {
        throw new BookingError('No autorizado para modificar esta cita.', 403);
      }
      if (user.role === 'CLIENT' && !reschedule && changes.status !== 'CANCELLED') {
        throw new BookingError('Solo puedes cancelar tus propias citas.', 403);
      }
      if (user.role === 'CLIENT' && appointment.status === 'CANCELLED') {
        throw new BookingError('La cita ya fue cancelada.', 409);
      }
      if (user.role === 'STYLIST' &&
          (appointment.stylist !== user.username.toLowerCase() ||
            changes.status === 'PENDING' || appointment.status === 'CANCELLED')) {
        throw new BookingError('No autorizado para modificar esta cita.', 403);
      }
      if (reschedule && appointment.status === 'CANCELLED') {
        throw new BookingError('No se puede reprogramar una cita cancelada.', 409);
      }

      const nextStylist = changes.stylist === undefined
        ? appointment.stylist
        : changes.stylist.trim().toLowerCase();
      await lockBookingResources(session, [appointment.stylist, nextStylist]);
      const nextDate = changes.date || appointment.date;
      const nextTime = changes.time || appointment.time;
      const nextStatus = changes.status || appointment.status;
      if (['PENDING', 'CONFIRMED'].includes(nextStatus)) {
        const validationError = await validateBookingSlot({
          date: nextDate,
          time: nextTime,
          duration: appointment.duration || 60,
          stylist: nextStylist,
          session,
          excludeId: appointment._id
        });
        if (validationError) throw new BookingError(validationError, 409);
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
  if (reason && shouldNotify && updated) notifyAppointment(updated, reason);
  return updated;
};

const getBogotaDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Appointment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }
    res.json({ success: true, message: 'Cita eliminada permanentemente.' });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
