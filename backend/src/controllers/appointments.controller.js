import Appointment from '../models/appointment.model.js';

export const getAppointments = async (req, res) => {
  try {
    let appointments;
    if (req.user.role === 'ADMIN' || req.user.role === 'STYLIST') {
      appointments = await Appointment.find().sort({ createdAt: -1 });
    } else {
      appointments = await Appointment.find({ username: req.user.username.toLowerCase() }).sort({ createdAt: -1 });
    }
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { service, date, time, notes } = req.body;
    if (!service || !date || !time) {
      return res.status(400).json({ error: 'Servicio, fecha y hora son obligatorios.' });
    }
    const newAppointment = await Appointment.create({
      username: req.user.username,
      service,
      date,
      time,
      notes: notes || '',
      status: 'CONFIRMED'
    });
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'El estado es requerido.' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    if (req.user.role !== 'ADMIN' && appointment.username !== req.user.username.toLowerCase()) {
      return res.status(403).json({ error: 'No autorizado para modificar esta cita.' });
    }

    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Appointment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }
    res.json({ success: true, message: 'Cita eliminada permanentemente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
