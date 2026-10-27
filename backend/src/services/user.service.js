import { EMAIL_PATTERN, assertNewAccountFields } from '../utils/validation.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/index.js';

export default class UserService {
  static ROLES = ['ADMIN', 'CLIENT', 'STYLIST'];
  static #CLOCK_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

  #users;
  #appointments;
  #hasher;
  #clock;

  constructor({ userModel, appointmentModel, passwordHasher, clock }) {
    this.#users = userModel;
    this.#appointments = appointmentModel;
    this.#hasher = passwordHasher;
    this.#clock = clock;
  }

  listAll() {
    return this.#users.find().select('-password');
  }

  // Alta desde el panel de administrador: a diferencia del registro público, permite elegir el rol.
  async create({ username, password, fullName, email, phoneNumber, role = 'CLIENT' }) {
    assertNewAccountFields({ username, password, fullName, email });
    if (!UserService.ROLES.includes(role)) {
      throw new ValidationError('El rol no es válido.');
    }

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

    let created;
    try {
      created = await this.#users.create({
        username: normalizedUsername,
        password: await this.#hasher.hash(password),
        fullName: fullName.trim(),
        email: normalizedEmail,
        phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim().slice(0, 30) : '',
        role
      });
    } catch (error) {
      if (error?.code === 11000) throw new ConflictError('El nombre de usuario o correo ya está registrado.', { cause: error });
      throw error;
    }
    // Misma forma que listAll: sin contraseña ni campos internos.
    return this.#users.findById(created._id).select('-password');
  }

  listStylists() {
    return this.#users.find({ role: 'STYLIST', isActive: { $ne: false } })
      .select('username fullName weeklySchedule');
  }

  async getSchedule(userId) {
    const user = await this.#users.findById(userId).select('weeklySchedule');
    if (!user) throw new NotFoundError('Usuario no encontrado.');
    return user.weeklySchedule;
  }

  async updateSchedule(userId, days) {
    if (!this.#isValidWeek(days)) {
      throw new ValidationError('El horario semanal no es válido.');
    }
    const user = await this.#users.findByIdAndUpdate(
      userId,
      { weeklySchedule: days },
      { new: true, runValidators: true }
    ).select('weeklySchedule');
    if (!user) throw new NotFoundError('Usuario no encontrado.');
    return user.weeklySchedule;
  }

  async update(id, { role, fullName, email, phoneNumber, isActive }, currentUser) {
    const updates = {};
    if (phoneNumber !== undefined) {
      if (typeof phoneNumber !== 'string' || phoneNumber.trim().length > 30) {
        throw new ValidationError('El teléfono no es válido.');
      }
      updates.phoneNumber = phoneNumber.trim();
    }
    if (role !== undefined) {
      if (!UserService.ROLES.includes(role)) {
        throw new ValidationError('El rol no es válido.');
      }
      updates.role = role;
    }
    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || !fullName.trim()) {
        throw new ValidationError('El nombre no puede quedar vacío.');
      }
      updates.fullName = fullName.trim();
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
        throw new ValidationError('El correo electrónico no es válido.');
      }
      updates.email = email.trim().toLowerCase();
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        throw new ValidationError('El estado de la cuenta no es válido.');
      }
      updates.isActive = isActive;
    }

    const existing = await this.#users.findById(id);
    if (!existing) throw new NotFoundError('Usuario no encontrado.');
    const isSelf = existing._id.toString() === currentUser.id;
    if (isSelf && ((role && role !== existing.role) || isActive === false)) {
      throw new ValidationError('No puedes cambiar tu propio rol o desactivar tu cuenta.');
    }
    if (existing.role === 'ADMIN' && (role && role !== 'ADMIN' || isActive === false) &&
        await this.#users.countDocuments({ role: 'ADMIN', isActive: { $ne: false } }) <= 1) {
      throw new ConflictError('No se puede cambiar el rol del último administrador.');
    }
    // Solo bloquean las citas de hoy en adelante: una cita pasada que quedó
    // pendiente ya no ocupa la agenda del estilista.
    if (existing.role === 'STYLIST' && (role && role !== 'STYLIST' || isActive === false) &&
        await this.#appointments.exists({
          stylist: existing.username,
          status: { $in: ['PENDING', 'CONFIRMED'] },
          date: { $gte: this.#clock.today() }
        })) {
      throw new ConflictError('El estilista tiene citas próximas. Reasígnalas o cancélalas en "Gestionar citas" antes de cambiar su estado o rol.');
    }
    // Un cliente desactivado ya no puede entrar a cancelar sus citas, que seguirían
    // ocupando la agenda: primero hay que cancelarlas.
    if (existing.role === 'CLIENT' && isActive === false &&
        await this.#appointments.exists({
          username: existing.username,
          status: { $in: ['PENDING', 'CONFIRMED'] },
          date: { $gte: this.#clock.today() }
        })) {
      throw new ConflictError('El cliente tiene citas próximas. Cancélalas en "Gestionar citas" antes de desactivar su cuenta.');
    }

    let updated;
    try {
      updated = await this.#users.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');
    } catch (error) {
      if (error?.code === 11000) throw new ConflictError('Ese correo ya está asociado a otra cuenta.', { cause: error });
      throw error;
    }
    if (!updated) throw new NotFoundError('Usuario no encontrado.');
    return updated;
  }

  async delete(id, currentUser) {
    if (id === currentUser.id) {
      throw new ValidationError('No puedes eliminar tu propia cuenta de administrador.');
    }
    const target = await this.#users.findById(id);
    if (!target) throw new NotFoundError('Usuario no encontrado.');
    if (target.role === 'ADMIN' && await this.#users.countDocuments({ role: 'ADMIN' }) <= 1) {
      throw new ConflictError('No se puede eliminar al último administrador.');
    }
    if (await this.#appointments.exists({
      $or: [{ username: target.username }, { stylist: target.username }]
    })) {
      throw new ConflictError('La cuenta tiene citas registradas y se conserva para no perder el historial. Desactívala en su lugar.');
    }
    await this.#users.findByIdAndDelete(id);
  }

  #isValidWeek(days) {
    return Array.isArray(days) && days.length === 7 &&
      days.every((day, index) => day && day.day === index &&
        typeof day.enabled === 'boolean' &&
        UserService.#CLOCK_PATTERN.test(day.start) &&
        UserService.#CLOCK_PATTERN.test(day.end) &&
        (!day.enabled || day.start < day.end));
  }
}
