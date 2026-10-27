import mongoose from 'mongoose';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors/index.js';

export default class ReviewService {
  static MAX_COMMENT = 500;

  #reviews;
  #appointments;
  #users;

  constructor({ reviewModel, appointmentModel, userModel }) {
    this.#reviews = reviewModel;
    this.#appointments = appointmentModel;
    this.#users = userModel;
  }

  // "Ana María Pérez" -> "Ana P.": suficiente para una reseña pública.
  static shortName(fullName = '') {
    const [first = '', ...rest] = fullName.trim().split(/\s+/);
    const last = rest.at(-1);
    return last ? `${first} ${last[0].toUpperCase()}.` : first;
  }

  static toPublic(review) {
    return {
      _id: review._id,
      service: review.service,
      stylist: review.stylist,
      rating: review.rating,
      comment: review.comment,
      authorName: review.authorName || 'Cliente',
      createdAt: review.createdAt
    };
  }

  async create(user, { appointmentId, rating, comment = '' }) {
    if (!mongoose.isValidObjectId(appointmentId)) {
      throw new ValidationError('La cita no es válida.');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ValidationError('La calificación debe ser un número entero de 1 a 5.');
    }
    if (typeof comment !== 'string' || comment.trim().length > ReviewService.MAX_COMMENT) {
      throw new ValidationError(`El comentario no puede superar ${ReviewService.MAX_COMMENT} caracteres.`);
    }
    const appointment = await this.#appointments.findById(appointmentId);
    if (!appointment) throw new NotFoundError('Cita no encontrada.');
    if (appointment.username !== user.username.toLowerCase()) {
      throw new ForbiddenError('Solo puedes calificar tus propias citas.');
    }
    if (appointment.status !== 'COMPLETED') {
      throw new ValidationError('Solo puedes calificar una cita completada.');
    }
    const author = await this.#users.findOne({ username: appointment.username }).select('fullName');
    try {
      return await this.#reviews.create({
        appointment: appointment._id,
        username: appointment.username,
        authorName: ReviewService.shortName(author?.fullName),
        service: appointment.service,
        stylist: appointment.stylist,
        rating,
        comment: comment.trim()
      });
    } catch (error) {
      if (error?.code === 11000) throw new ConflictError('Ya calificaste esta cita.', { cause: error });
      throw error;
    }
  }

  // Reseñas públicas más recientes; opcionalmente de un servicio y solo con comentario.
  async listPublic({ service, withComment, limit = 20 } = {}) {
    const query = {};
    if (typeof service === 'string' && service.trim()) query.service = service.trim();
    if (withComment) query.comment = { $ne: '' };
    const max = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 50);
    const reviews = await this.#reviews.find(query).sort({ createdAt: -1 }).limit(max);
    return reviews.map(ReviewService.toPublic);
  }

  // Promedio y cantidad de reseñas por servicio y por estilista.
  async summary() {
    const group = field => this.#reviews.aggregate([
      { $match: { [field]: { $ne: '' } } },
      { $group: { _id: `$${field}`, average: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const round = items => items.map(({ _id, average, count }) => ({ name: _id, average: Math.round(average * 10) / 10, count }));
    const [services, stylists] = await Promise.all([group('service'), group('stylist')]);
    return { services: round(services), stylists: round(stylists) };
  }

  // Ids de las citas que el cliente ya calificó.
  async reviewedAppointmentIds(user) {
    const reviews = await this.#reviews.find({ username: user.username.toLowerCase() }).select('appointment');
    return reviews.map(review => review.appointment.toString());
  }

  // Moderación del administrador: lista completa, con el usuario que la escribió.
  listAll() {
    return this.#reviews.find().sort({ createdAt: -1 }).limit(200);
  }

  async delete(id) {
    if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Reseña no encontrada.');
    const deleted = await this.#reviews.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundError('Reseña no encontrada.');
  }
}
