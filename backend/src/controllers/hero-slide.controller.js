import BaseController from './base.controller.js';

export default class HeroSlideController extends BaseController {
  #slides;

  constructor(heroSlideService) {
    super();
    this.#slides = heroSlideService;
  }

  async list(_req, res) {
    res.json(await this.#slides.listPublic());
  }

  async listAll(_req, res) {
    res.json(await this.#slides.listAll());
  }

  async create(req, res) {
    res.status(201).json(await this.#slides.create(req.body));
  }

  async update(req, res) {
    res.json(await this.#slides.update(req.params.id, req.body));
  }

  async reorder(req, res) {
    res.json(await this.#slides.reorder(req.body?.ids));
  }

  async remove(req, res) {
    await this.#slides.remove(req.params.id);
    res.json({ success: true, message: 'Imagen quitada del carrusel.' });
  }
}
