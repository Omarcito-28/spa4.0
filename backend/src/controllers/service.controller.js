import BaseController from './base.controller.js';

export default class ServiceController extends BaseController {
  #catalog;

  constructor(serviceCatalogService) {
    super();
    this.#catalog = serviceCatalogService;
  }

  async list(_req, res) {
    res.json(await this.#catalog.listAll());
  }

  async create(req, res) {
    res.status(201).json(await this.#catalog.create(req.body));
  }

  async update(req, res) {
    res.json(await this.#catalog.update(req.params.id, req.body));
  }

  async remove(req, res) {
    await this.#catalog.delete(req.params.id);
    res.json({ success: true, message: 'Servicio eliminado.' });
  }
}
