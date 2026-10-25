import crypto from 'node:crypto';
import { EMAIL_PATTERN, assertNewAccountFields } from '../utils/validation.js';
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError
} from '../errors/index.js';

export default class AuthService {
  static RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

  #users;
  #hasher;
  #tokens;
  #email;
  #env;

  constructor({ userModel, passwordHasher, tokenService, emailService, env = process.env }) {
    this.#users = userModel;
    this.#hasher = passwordHasher;
    this.#tokens = tokenService;
    this.#email = emailService;
    this.#env = env;
  }

  static toPublicUser(user) {
    return {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role
    };
  }

  async register({ username, password, fullName, email, phoneNumber }) {
    assertNewAccountFields({ username, password, fullName, email });

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.#users.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
    });
    if (existingUser) {
      throw new ConflictError(existingUser.username === normalizedUsername
        ? 'El nombre de usuario ya existe.'
        : 'El correo electrónico ya está registrado.');
    }

    let newUser;
    try {
      newUser = await this.#users.create({
        username: normalizedUsername,
        password: await this.#hasher.hash(password),
        fullName: fullName.trim(),
        email: normalizedEmail,
        phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim().slice(0, 30) : '',
        role: 'CLIENT'
      });
    } catch (error) {
      throw AuthService.#duplicateKey(error, 'El nombre de usuario o correo ya está registrado.');
    }
    return this.#session(newUser);
  }

  async login({ username, password }) {
    if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
      throw new ValidationError('Usuario y contraseña son requeridos.');
    }

    const identity = username.trim().toLowerCase();
    const user = await this.#users.findOne({
      $or: [{ username: identity }, { email: identity }]
    });
    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }
    if (user.isActive === false) {
      throw new UnauthorizedError('La cuenta está desactivada. Contacta al administrador.');
    }
    if (!await this.#hasher.compare(password, user.password)) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }
    return this.#session(user);
  }

  async getProfile(currentUser) {
    const user = await this.#users.findOne({ username: currentUser.username }).select('-password');
    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }
    return AuthService.toPublicUser(user);
  }

  async updateProfile(currentUser, { fullName, email, password, phoneNumber, currentPassword }) {
    const updates = {};
    if (typeof fullName === 'string' && fullName.trim()) updates.fullName = fullName.trim();
    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        throw new ValidationError('El correo electrónico no es válido.');
      }
      const emailOwner = await this.#users.findOne({ email: normalizedEmail });
      if (emailOwner && emailOwner.username !== currentUser.username) {
        throw new ConflictError('El correo electrónico ya está registrado.');
      }
      updates.email = normalizedEmail;
    }
    if (typeof phoneNumber === 'string') updates.phoneNumber = phoneNumber.trim();
    if (password) {
      const storedUser = await this.#users.findOne({ username: currentUser.username });
      if (typeof currentPassword !== 'string' || !storedUser ||
          !await this.#hasher.compare(currentPassword, storedUser.password)) {
        throw new UnauthorizedError('La contraseña actual no es correcta.');
      }
      if (password.length < 8) {
        throw new ValidationError('La contraseña debe tener al menos 8 caracteres.');
      }
      updates.password = await this.#hasher.hash(password);
      updates.$inc = { tokenVersion: 1 };
    }

    let updatedUser;
    try {
      updatedUser = await this.#users.findOneAndUpdate(
        { username: currentUser.username },
        updates,
        { new: true }
      ).select('-password');
    } catch (error) {
      throw AuthService.#duplicateKey(error, 'El correo electrónico ya está registrado.');
    }
    if (!updatedUser) {
      throw new NotFoundError('Usuario no encontrado.');
    }
    return this.#session(updatedUser);
  }

  // Responde siempre lo mismo para no revelar qué correos tienen cuenta.
  async requestPasswordReset(email) {
    if (!this.#email.isConfigured()) {
      throw new ServiceUnavailableError('La recuperación de contraseña no está configurada. Contacta al spa.');
    }
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
      throw new ValidationError('Ingresa un correo electrónico válido.');
    }

    try {
      const user = await this.#users.findOne({ email: email.trim().toLowerCase() });
      if (user && user.isActive !== false) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetTokenHash = AuthService.#hashResetToken(resetToken);
        user.passwordResetExpiresAt = new Date(Date.now() + AuthService.RESET_TOKEN_TTL_MS);
        await user.save();
        const frontendUrl = this.#env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;
        await this.#email.send({
          to: user.email,
          subject: 'Restablecer contraseña de Essence De Toi',
          text: `Recibimos una solicitud para cambiar tu contraseña. Abre este enlace dentro de los próximos 30 minutos:\n\n${resetUrl}\n\nSi no solicitaste el cambio, ignora este mensaje.`
        });
      }
    } catch (error) {
      console.error('No se pudo procesar la solicitud de recuperación de contraseña:', error.message);
    }
    return 'Si el correo está asociado a una cuenta, recibirás instrucciones para restablecer la contraseña.';
  }

  async resetPassword({ token, password }) {
    if (typeof token !== 'string' || token.length !== 64 ||
        typeof password !== 'string' || password.length < 8) {
      throw new ValidationError('El enlace o la nueva contraseña no son válidos.');
    }
    const user = await this.#users.findOne({
      passwordResetTokenHash: AuthService.#hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
      isActive: { $ne: false }
    }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (!user) {
      throw new ValidationError('El enlace venció o ya fue utilizado. Solicita uno nuevo.');
    }
    user.password = await this.#hasher.hash(password);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.tokenVersion += 1;
    await user.save();
    return 'Contraseña actualizada. Ya puedes iniciar sesión.';
  }

  #session(user) {
    return { token: this.#tokens.sign(user), user: AuthService.toPublicUser(user) };
  }

  static #hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static #duplicateKey(error, message) {
    return error?.code === 11000 ? new ConflictError(message, { cause: error }) : error;
  }
}
