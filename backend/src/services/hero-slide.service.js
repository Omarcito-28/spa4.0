import mongoose from 'mongoose';
import { NotFoundError, ValidationError } from '../errors/index.js';

// Carrusel de la portada. Mientras no haya diapositivas visibles, el sitio
// muestra sus imágenes predeterminadas.
export default class HeroSlideService {
  static MAX_SLIDES = 10;
  static MAX_ALT_LENGTH = 140;
  // Solo imágenes del propio sitio: incluidas en /public o subidas al panel.
  // Así nadie puede insertar una URL externa ni texto que rompa el CSS del fondo.
  static IMAGE_PATTERN = /^(\/api\/service-images\/[a-f0-9]{24}|\/images\/[a-z0-9_-]+(\/[a-z0-9_-]+)*\.(jpe?g|png|webp))$/i;

  #slides;

  constructor({ heroSlideModel }) {
    this.#slides = heroSlideModel;
  }

  async listPublic() {
    const slides = await this.#slides.find({ isActive: true }).sort({ position: 1, createdAt: 1 });
    return slides.map(slide => ({ _id: slide._id.toString(), image: slide.image, alt: slide.alt }));
  }

  async listAll() {
    const slides = await this.#slides.find().sort({ position: 1, createdAt: 1 });
    return slides.map(HeroSlideService.#summary);
  }

  async create({ image, alt = '' } = {}) {
    const values = { image: HeroSlideService.#image(image), alt: HeroSlideService.#alt(alt) };
    if (await this.#slides.countDocuments() >= HeroSlideService.MAX_SLIDES) {
      throw new ValidationError(`El carrusel admite hasta ${HeroSlideService.MAX_SLIDES} imágenes. Quita una antes de agregar otra.`);
    }
    const last = await this.#slides.findOne().sort({ position: -1 });
    const slide = await this.#slides.create({ ...values, position: (last?.position ?? -1) + 1 });
    return HeroSlideService.#summary(slide);
  }

  async update(id, { alt, isActive } = {}) {
    const updates = {};
    if (alt !== undefined) updates.alt = HeroSlideService.#alt(alt);
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') throw new ValidationError('El estado de la imagen no es válido.');
      updates.isActive = isActive;
    }
    const slide = HeroSlideService.#validId(id)
      ? await this.#slides.findByIdAndUpdate(id, updates, { new: true })
      : null;
    if (!slide) throw new NotFoundError('Imagen del carrusel no encontrada.');
    return HeroSlideService.#summary(slide);
  }

  // Recibe todos los ids en el orden nuevo.
  async reorder(ids) {
    const current = await this.#slides.find().select('_id');
    const known = new Set(current.map(slide => slide._id.toString()));
    if (!Array.isArray(ids) || ids.length !== known.size || new Set(ids).size !== ids.length ||
        !ids.every(id => known.has(String(id)))) {
      throw new ValidationError('El orden debe incluir cada imagen del carrusel una sola vez.');
    }
    await this.#slides.bulkWrite(ids.map((id, position) => ({
      updateOne: { filter: { _id: id }, update: { $set: { position } } }
    })));
    return this.listAll();
  }

  async remove(id) {
    const slide = HeroSlideService.#validId(id) ? await this.#slides.findByIdAndDelete(id) : null;
    if (!slide) throw new NotFoundError('Imagen del carrusel no encontrada.');
  }

  static #image(image) {
    const value = typeof image === 'string' ? image.trim() : '';
    if (!HeroSlideService.IMAGE_PATTERN.test(value)) {
      throw new ValidationError('Elige una imagen de la galería o sube una nueva.');
    }
    return value;
  }

  static #alt(alt) {
    if (typeof alt !== 'string') throw new ValidationError('La descripción no es válida.');
    const value = alt.trim();
    if (value.length > HeroSlideService.MAX_ALT_LENGTH) {
      throw new ValidationError(`La descripción admite hasta ${HeroSlideService.MAX_ALT_LENGTH} caracteres.`);
    }
    return value;
  }

  static #validId(id) {
    return mongoose.isValidObjectId(id);
  }

  static #summary(slide) {
    return {
      _id: slide._id.toString(),
      image: slide.image,
      alt: slide.alt,
      position: slide.position,
      isActive: slide.isActive
    };
  }
}
