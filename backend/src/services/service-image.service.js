import mongoose from 'mongoose';
import { NotFoundError, ValidationError } from '../errors/index.js';

// Firmas de archivo aceptadas: el tipo se decide por los bytes, no por la cabecera del cliente.
const SIGNATURES = [
  { type: 'image/jpeg', matches: bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { type: 'image/png', matches: bytes => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'image/webp', matches: bytes => bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP' }
];

// Imágenes de los servicios que el administrador sube desde el panel.
export default class ServiceImageService {
  static MAX_BYTES = 5 * 1024 * 1024;
  static URL_PREFIX = '/api/service-images/';

  #images;

  constructor({ serviceImageModel }) {
    this.#images = serviceImageModel;
  }

  static detectType(bytes) {
    return SIGNATURES.find(signature => signature.matches(bytes))?.type ?? null;
  }

  static urlFor(id) {
    return `${ServiceImageService.URL_PREFIX}${id}`;
  }

  async upload(bytes, name = '') {
    if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
      throw new ValidationError('Selecciona una imagen para subir.');
    }
    if (bytes.length > ServiceImageService.MAX_BYTES) {
      throw new ValidationError('La imagen no puede superar 5 MB.');
    }
    const contentType = ServiceImageService.detectType(bytes);
    if (!contentType) {
      throw new ValidationError('Formato no admitido. Usa una imagen JPG, PNG o WebP.');
    }
    const image = await this.#images.create({
      data: bytes,
      contentType,
      size: bytes.length,
      name: String(name).slice(0, 120)
    });
    return ServiceImageService.#summary(image);
  }

  // Lista sin el contenido binario, para la galería del panel.
  async list() {
    const images = await this.#images.find().select('contentType size name createdAt').sort({ createdAt: -1 });
    return images.map(image => ServiceImageService.#summary(image));
  }

  async get(id) {
    const image = mongoose.isValidObjectId(id) ? await this.#images.findById(id) : null;
    if (!image) throw new NotFoundError('Imagen no encontrada.');
    return image;
  }

  static #summary(image) {
    return {
      _id: image._id.toString(),
      url: ServiceImageService.urlFor(image._id),
      name: image.name,
      size: image.size,
      contentType: image.contentType,
      createdAt: image.createdAt
    };
  }
}
