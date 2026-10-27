import mongoose from 'mongoose';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/index.js';

// Notas internas sobre los clientes. Un estilista solo accede a las de clientes
// con los que tiene o tuvo citas; el administrador accede a todas.
export default class ClientNoteService {
  static MAX_LENGTH = 1000;

  #notes;
  #users;
  #appointments;

  constructor({ clientNoteModel, userModel, appointmentModel }) {
    this.#notes = clientNoteModel;
    this.#users = userModel;
    this.#appointments = appointmentModel;
  }

  async list(user, client) {
    const username = await this.#assertAccess(user, client);
    return this.#notes.find({ client: username }).sort({ createdAt: -1 });
  }

  async create(user, client, { text }) {
    if (typeof text !== 'string' || !text.trim()) {
      throw new ValidationError('Escribe la nota.');
    }
    if (text.trim().length > ClientNoteService.MAX_LENGTH) {
      throw new ValidationError(`La nota no puede superar ${ClientNoteService.MAX_LENGTH} caracteres.`);
    }
    const username = await this.#assertAccess(user, client);
    return this.#notes.create({
      client: username,
      author: user.username.toLowerCase(),
      authorName: user.fullName || user.username,
      text: text.trim()
    });
  }

  async delete(id, user) {
    if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Nota no encontrada.');
    const note = await this.#notes.findById(id);
    if (!note) throw new NotFoundError('Nota no encontrada.');
    if (user.role !== 'ADMIN' && note.author !== user.username.toLowerCase()) {
      throw new ForbiddenError('Solo puedes borrar tus propias notas.');
    }
    await this.#notes.findByIdAndDelete(id);
  }

  async #assertAccess(user, client) {
    const username = typeof client === 'string' ? client.trim().toLowerCase() : '';
    if (!username || !await this.#users.exists({ username, role: 'CLIENT' })) {
      throw new NotFoundError('Cliente no encontrado.');
    }
    if (user.role === 'STYLIST' &&
        !await this.#appointments.exists({ username, stylist: user.username.toLowerCase() })) {
      throw new ForbiddenError('Solo puedes ver las notas de clientes que atiendes.');
    }
    return username;
  }
}
