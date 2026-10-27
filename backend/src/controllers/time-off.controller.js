import BaseController from './base.controller.js';

export default class TimeOffController extends BaseController {
  static FAILURE_MESSAGES = {
    list: 'No se pudieron cargar los días bloqueados.',
    create: 'No se pudo bloquear la agenda.',
    remove: 'No se pudo quitar el bloqueo.'
  };

  #timeOff;

  constructor(timeOffService) {
    super();
    this.#timeOff = timeOffService;
  }

  async list(req, res) {
    res.json(await this.#timeOff.list(req.user));
  }

  async create(req, res) {
    res.status(201).json(await this.#timeOff.create(req.user, req.body));
  }

  async remove(req, res) {
    await this.#timeOff.delete(req.params.id, req.user);
    res.json({ success: true, message: 'Bloqueo eliminado.' });
  }
}
