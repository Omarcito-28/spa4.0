import AppointmentTime from '../utils/appointment-time.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors/index.js';

// Días libres de los estilistas y cierres del spa. Un bloqueo con `stylist`
// vacío cierra la agenda de todos los estilistas y la de citas sin asignar.
export default class TimeOffService {
  static MAX_DAYS = 366;
  static #ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'];

  #timeOff;
  #users;
  #appointments;
  #locks;
  #clock;

  constructor({ timeOffModel, userModel, appointmentModel, bookingLockService, clock }) {
    this.#timeOff = timeOffModel;
    this.#users = userModel;
    this.#appointments = appointmentModel;
    this.#locks = bookingLockService;
    this.#clock = clock;
  }

  // Solo los bloqueos vigentes o futuros: los pasados ya no afectan la agenda.
  list(user) {
    const query = { end: { $gte: this.#clock.today() } };
    if (user.role === 'STYLIST') query.stylist = { $in: ['', user.username.toLowerCase()] };
    return this.#timeOff.find(query).sort({ start: 1, end: 1 });
  }

  async create(user, { stylist = '', start, end, reason = '' }) {
    if (typeof start !== 'string' || typeof end !== 'string' || typeof stylist !== 'string' ||
        typeof reason !== 'string' || !AppointmentTime.isValidDate(start) || !AppointmentTime.isValidDate(end)) {
      throw new ValidationError('Las fechas del bloqueo no son válidas.');
    }
    if (start > end) {
      throw new ValidationError('La fecha final debe ser igual o posterior a la inicial.');
    }
    if (start < this.#clock.today()) {
      throw new ValidationError('No puedes bloquear fechas pasadas.');
    }
    if (AppointmentTime.daysBetween(start, end) + 1 > TimeOffService.MAX_DAYS) {
      throw new ValidationError('Un bloqueo no puede durar más de un año.');
    }
    if (reason.trim().length > 120) {
      throw new ValidationError('El motivo no puede superar 120 caracteres.');
    }

    // El estilista solo bloquea su propia agenda; el administrador elige a quién o cierra el spa.
    const target = user.role === 'STYLIST' ? user.username.toLowerCase() : stylist.trim().toLowerCase();
    if (target && !await this.#users.exists({ username: target, role: 'STYLIST', isActive: { $ne: false } })) {
      throw new ValidationError('El estilista seleccionado no está disponible.');
    }

    const session = await this.#timeOff.startSession();
    let created;
    try {
      await session.withTransaction(async () => {
        // Mismo bloqueo que usan las reservas, para que nadie reserve en esas fechas mientras se guarda.
        const affected = target ? [target] : ['', ...await this.#activeStylists(session)];
        await this.#locks.lock(session, affected);

        if (await this.#timeOff.exists({ stylist: target, start: { $lte: end }, end: { $gte: start } }).session(session)) {
          throw new ConflictError(target
            ? 'Ya hay un bloqueo de este estilista que se cruza con esas fechas.'
            : 'Ya hay un cierre del spa que se cruza con esas fechas.');
        }
        const pending = await this.#appointments.countDocuments({
          ...(target ? { stylist: target } : {}),
          date: { $gte: start, $lte: end },
          status: { $in: TimeOffService.#ACTIVE_STATUSES }
        }).session(session);
        if (pending) {
          throw new ConflictError(`Hay ${pending} ${pending === 1 ? 'cita activa' : 'citas activas'} en esas fechas. ` +
            'Reasígnalas o cancélalas antes de bloquear la agenda.');
        }
        [created] = await this.#timeOff.create([{
          stylist: target,
          start,
          end,
          reason: reason.trim(),
          createdBy: user.username.toLowerCase()
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    return created;
  }

  async delete(id, user) {
    const block = await this.#timeOff.findById(id);
    if (!block) throw new NotFoundError('Bloqueo no encontrado.');
    if (user.role === 'STYLIST' && block.stylist !== user.username.toLowerCase()) {
      throw new ForbiddenError('Solo puedes quitar tus propios días libres.');
    }
    await this.#timeOff.findByIdAndDelete(id);
  }

  // Devuelve el bloqueo que cubre esa fecha para el estilista (o para todo el spa), si existe.
  findBlocking(date, stylist = '', session) {
    const stylists = stylist ? ['', stylist] : [''];
    const query = this.#timeOff.findOne({ stylist: { $in: stylists }, start: { $lte: date }, end: { $gte: date } });
    return session ? query.session(session) : query;
  }

  static describe(block) {
    const reason = block.reason ? ` (${block.reason})` : '';
    return block.stylist
      ? `El estilista no atiende ese día${reason}.`
      : `El spa estará cerrado ese día${reason}.`;
  }

  async #activeStylists(session) {
    const stylists = await this.#users.find({ role: 'STYLIST', isActive: { $ne: false } })
      .select('username').session(session);
    return stylists.map(stylist => stylist.username);
  }
}
