import User from '../models/user.model.js';
import Appointment from '../models/appointment.model.js';

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch {
    res.status(500).json({ error: 'No se pudieron cargar los usuarios.' });
  }
};

export const getStylists = async (_req, res) => {
  try {
    const stylists = await User.find({ role: 'STYLIST', isActive: { $ne: false } })
      .select('username fullName weeklySchedule');
    res.json(stylists);
  } catch {
    res.status(500).json({ error: 'No se pudieron cargar los estilistas.' });
  }
};

export const getSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('weeklySchedule');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(user.weeklySchedule);
  } catch {
    res.status(500).json({ error: 'No se pudo cargar el horario.' });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const days = req.body.weeklySchedule;
    if (!Array.isArray(days) || days.length !== 7 ||
        days.some((day, index) => !day || day.day !== index ||
          typeof day.enabled !== 'boolean' ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.start) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.end) ||
          (day.enabled && day.start >= day.end))) {
      return res.status(400).json({ error: 'El horario semanal no es válido.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { weeklySchedule: days },
      { new: true, runValidators: true }
    ).select('weeklySchedule');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(user.weeklySchedule);
  } catch {
    res.status(500).json({ error: 'No se pudo guardar el horario.' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { role, fullName, email, isActive } = req.body;
    const updates = {};
    if (role !== undefined) {
      if (!['ADMIN', 'CLIENT', 'STYLIST'].includes(role)) {
        return res.status(400).json({ error: 'El rol no es válido.' });
      }
      updates.role = role;
    }
    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || !fullName.trim()) {
        return res.status(400).json({ error: 'El nombre no puede quedar vacío.' });
      }
      updates.fullName = fullName.trim();
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'El correo electrónico no es válido.' });
      }
      updates.email = email.trim().toLowerCase();
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'El estado de la cuenta no es válido.' });
      }
      updates.isActive = isActive;
    }

    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const isSelf = existing._id.toString() === req.user.id;
    if (isSelf && ((role && role !== existing.role) || isActive === false)) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol o desactivar tu cuenta.' });
    }
    if (existing.role === 'ADMIN' && (role && role !== 'ADMIN' || isActive === false) &&
        await User.countDocuments({ role: 'ADMIN', isActive: { $ne: false } }) <= 1) {
      return res.status(409).json({ error: 'No se puede cambiar el rol del último administrador.' });
    }
    if (existing.role === 'STYLIST' && (role && role !== 'STYLIST' || isActive === false) &&
        await Appointment.exists({ stylist: existing.username, status: { $in: ['PENDING', 'CONFIRMED'] } })) {
      return res.status(409).json({ error: 'Reasigna o cancela sus citas antes de cambiar el estado o rol.' });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Ese correo ya está asociado a otra cuenta.' });
    }
    res.status(500).json({ error: 'No se pudo actualizar el usuario.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador.' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (target.role === 'ADMIN' && await User.countDocuments({ role: 'ADMIN' }) <= 1) {
      return res.status(409).json({ error: 'No se puede eliminar al último administrador.' });
    }
    if (await Appointment.exists({
      $or: [{ username: target.username }, { stylist: target.username }]
    })) {
      return res.status(409).json({ error: 'La cuenta tiene citas asociadas. Cancélalas o reasígnalas antes de eliminarla.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado.' });
  } catch {
    res.status(500).json({ error: 'No se pudo eliminar el usuario.' });
  }
};
