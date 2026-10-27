import BaseController from './base.controller.js';

export default class ReviewController extends BaseController {
  static FAILURE_MESSAGES = {
    list: 'No se pudieron cargar las reseñas.',
    summary: 'No se pudieron calcular las calificaciones.',
    create: 'No se pudo guardar la reseña.',
    remove: 'No se pudo eliminar la reseña.'
  };

  #reviews;

  constructor(reviewService) {
    super();
    this.#reviews = reviewService;
  }

  async list(req, res) {
    const { service, withComment, limit } = req.query;
    res.json(await this.#reviews.listPublic({ service, withComment: withComment === 'true', limit }));
  }

  async summary(_req, res) {
    res.json(await this.#reviews.summary());
  }

  async mine(req, res) {
    res.json(await this.#reviews.reviewedAppointmentIds(req.user));
  }

  async listAll(_req, res) {
    res.json(await this.#reviews.listAll());
  }

  async create(req, res) {
    res.status(201).json(await this.#reviews.create(req.user, req.body));
  }

  async remove(req, res) {
    await this.#reviews.delete(req.params.id);
    res.json({ success: true, message: 'Reseña eliminada.' });
  }
}
