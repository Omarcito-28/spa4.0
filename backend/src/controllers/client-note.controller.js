import BaseController from './base.controller.js';

export default class ClientNoteController extends BaseController {
  static FAILURE_MESSAGES = {
    list: 'No se pudieron cargar las notas del cliente.',
    create: 'No se pudo guardar la nota.',
    remove: 'No se pudo borrar la nota.'
  };

  #notes;

  constructor(clientNoteService) {
    super();
    this.#notes = clientNoteService;
  }

  async list(req, res) {
    res.json(await this.#notes.list(req.user, req.params.client));
  }

  async create(req, res) {
    res.status(201).json(await this.#notes.create(req.user, req.params.client, req.body));
  }

  async remove(req, res) {
    await this.#notes.delete(req.params.id, req.user);
    res.json({ success: true, message: 'Nota borrada.' });
  }
}
