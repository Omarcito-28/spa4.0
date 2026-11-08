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

  #google;

  constructor({ userModel, passwordHasher, tokenService, emailService, googleIdentity, env = process.env }) {
    this.#users = userModel;
    this.#hasher = passwordHasher;
    this.#tokens = tokenService;
    this.#email = emailService;
    this.#google = googleIdentity;
    this.#env = env;
  }

  // Nunca incluye la contraseña ni el identificador de Google: solo si existen.
  static toPublicUser(user) {
    return {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      hasPassword: Boolean(user.password),
      googleLinked: Boolean(user.googleId)
    };
  }

  // Métodos de inicio de sesión disponibles; el Client ID de Google es público.
  getProviders() {
    return { google: this.#google?.isConfigured() ? { clientId: this.#google.clientId } : null };
  }

  // Inicia sesión o crea la cuenta con Google. Una persona tiene una sola cuenta
  // por correo: si el correo ya existe (registrada con contraseña o creada por el
  // administrador), Google se vincula a ella; si no, se crea una cuenta de cliente.
  // Solo se vincula por correo cuando Google confirma que el correo está verificado.
  async loginWithGoogle({ credential } = {}) {
    if (!this.#google?.isConfigured()) {
      throw new ServiceUnavailableError('El inicio de sesión con Google no está configurado.');
    }
    const profile = await this.#google.verify(credential);
    if (!profile.emailVerified) {
      throw new UnauthorizedError('Tu correo de Google no está verificado. Verifícalo en Google o regístrate con contraseña.');
    }

    let user = await this.#users.findOne({ googleId: profile.googleId });
    if (!user) {
      user = await this.#users.findOne({ email: profile.email });
      if (user?.googleId) {
        throw new ConflictError('Este correo ya está vinculado a otra cuenta de Google.');
      }
    }
    if (user) {
      if (user.isActive === false) {
        throw new UnauthorizedError('La cuenta está desactivada. Contacta al administrador.');
      }
      if (!user.googleId) {
        user.googleId = profile.googleId;
        await user.save();
      }
      return { ...this.#session(user), isNewUser: false };
    }

    let newUser;
    try {
      newUser = await this.#users.create({
        username: await this.#availableUsername(profile.email),
        fullName: profile.fullName || profile.email.split('@')[0],
        email: profile.email,
        googleId: profile.googleId,
        phoneNumber: '',
        role: 'CLIENT'
      });
    } catch (error) {
      throw AuthService.#duplicateKey(error, 'No se pudo crear la cuenta con Google. Intenta de nuevo.');
    }
    return { ...this.#session(newUser), isNewUser: true };
  }

  // Usuario a partir del correo (ana.perez@gmail.com → ana.perez), con un número
  // al final si ya está en uso. La persona puede seguir entrando con su correo.
  async #availableUsername(email) {
    const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 24) || 'cliente';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate = attempt === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
      if (!await this.#users.findOne({ username: candidate })) return candidate;
    }
    return `${base}${crypto.randomBytes(4).toString('hex')}`;
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
    if (!user.password) {
      throw new UnauthorizedError('Esta cuenta se creó con Google. Usa "Continuar con Google" o crea una contraseña con "¿Olvidaste tu contraseña?".');
    }
    if (!await this.#hasher.compare(password, user.password)) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }
    return this.#session(user);
  }

  async getProfile(currentUser) {
    const user = await this.#users.findOne({ username: currentUser.username });
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
      if (!storedUser) {
        throw new NotFoundError('Usuario no encontrado.');
      }
      // Quien entró con Google y aún no tiene contraseña la crea sin pedir la actual:
      // ya demostró ser dueño de la cuenta al iniciar sesión.
      if (storedUser.password && (typeof currentPassword !== 'string' ||
          !await this.#hasher.compare(currentPassword, storedUser.password))) {
        throw new UnauthorizedError('La contraseña actual no es correcta.');
      }
      if (typeof password !== 'string' || password.length < 8) {
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
      );
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
