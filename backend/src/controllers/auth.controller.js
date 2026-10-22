import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../../config.js';
import { emailDeliveryConfigured, sendEmail } from '../services/email.service.js';

export const register = async (req, res) => {
  try {
    const { username, password, fullName, email, phoneNumber } = req.body;

    if (typeof username !== 'string' || typeof fullName !== 'string' || typeof email !== 'string' ||
        typeof password !== 'string' || !username.trim() || !password || !fullName.trim() || !email.trim()) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
    });
    if (existingUser) {
      return res.status(409).json({
        error: existingUser.username === normalizedUsername
          ? 'El nombre de usuario ya existe.'
          : 'El correo electrónico ya está registrado.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: normalizedUsername,
      password: hashedPassword,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim().slice(0, 30) : '',
      role: 'CLIENT'
    });

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role, email: newUser.email, fullName: newUser.fullName, tokenVersion: newUser.tokenVersion },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'El nombre de usuario o correo ya está registrado.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    const identity = username.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ username: identity }, { email: identity }]
    });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    if (user.isActive === false) {
      return res.status(401).json({ error: 'La cuenta está desactivada. Contacta al administrador.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, email: user.email, fullName: user.fullName, tokenVersion: user.tokenVersion },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role
    });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;
    const updates = {};
    if (typeof fullName === 'string' && fullName.trim()) updates.fullName = fullName.trim();
    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ error: 'El correo electrónico no es válido.' });
      }
      const emailOwner = await User.findOne({ email: normalizedEmail });
      if (emailOwner && emailOwner.username !== req.user.username) {
        return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
      }
      updates.email = normalizedEmail;
    }
    if (typeof phoneNumber === 'string') updates.phoneNumber = phoneNumber.trim();
    if (password) {
      const currentUser = await User.findOne({ username: req.user.username });
      if (typeof req.body.currentPassword !== 'string' || !currentUser ||
          !await bcrypt.compare(req.body.currentPassword, currentUser.password)) {
        return res.status(401).json({ error: 'La contraseña actual no es correcta.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      }
      updates.password = await bcrypt.hash(password, 10);
      updates.$inc = { tokenVersion: 1 };
    }

    const updatedUser = await User.findOneAndUpdate(
      { username: req.user.username },
      updates,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const token = jwt.sign(
      { id: updatedUser._id, username: updatedUser.username, role: updatedUser.role, email: updatedUser.email, fullName: updatedUser.fullName, tokenVersion: updatedUser.tokenVersion },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const requestPasswordReset = async (req, res) => {
  if (!emailDeliveryConfigured()) {
    return res.status(503).json({ error: 'La recuperación de contraseña no está configurada. Contacta al spa.' });
  }
  if (typeof req.body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim())) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }

  const responseMessage = 'Si el correo está asociado a una cuenta, recibirás instrucciones para restablecer la contraseña.';
  try {
    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    if (user && user.isActive !== false) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Restablecer contraseña de Essence De Toi',
        text: `Recibimos una solicitud para cambiar tu contraseña. Abre este enlace dentro de los próximos 30 minutos:\n\n${resetUrl}\n\nSi no solicitaste el cambio, ignora este mensaje.`
      });
    }
    res.status(202).json({ message: responseMessage });
  } catch (error) {
    console.error('No se pudo procesar la solicitud de recuperación de contraseña:', error.message);
    res.status(202).json({ message: responseMessage });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || token.length !== 64 ||
      typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'El enlace o la nueva contraseña no son válidos.' });
  }
  const passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  try {
    const user = await User.findOne({
      passwordResetTokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      isActive: { $ne: false }
    }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (!user) {
      return res.status(400).json({ error: 'El enlace venció o ya fue utilizado. Solicita uno nuevo.' });
    }
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.tokenVersion += 1;
    await user.save();
    res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('No se pudo restablecer la contraseña:', error.message);
    res.status(500).json({ error: 'No se pudo restablecer la contraseña.' });
  }
};
