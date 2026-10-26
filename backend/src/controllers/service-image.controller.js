import BaseController from './base.controller.js';

export default class ServiceImageController extends BaseController {
  #images;

  constructor(serviceImageService) {
    super();
    this.#images = serviceImageService;
  }

  async list(_req, res) {
    res.json(await this.#images.list());
  }

  // El cuerpo llega como binario (express.raw); el nombre original viaja en una cabecera.
  async upload(req, res) {
    const name = decodeURIComponent(req.get('X-File-Name') || '');
    res.status(201).json(await this.#images.upload(req.body, name));
  }

  async show(req, res) {
    const image = await this.#images.get(req.params.id);
    res.set({
      'Content-Type': image.contentType,
      'Content-Length': image.data.length,
      // Cada subida recibe un id nuevo, así que el contenido nunca cambia.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    res.send(image.data);
  }
}
