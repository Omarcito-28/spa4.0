import User from '../models/user.model.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, fullName, email } = req.body;

    const updates = {};
    if (role) updates.role = role;
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;

    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ success: true, message: 'Usuario eliminado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
