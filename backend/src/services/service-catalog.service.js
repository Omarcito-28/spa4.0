import { NotFoundError, ValidationError } from '../errors/index.js';

// Catálogo de servicios que ofrece el spa.
export default class ServiceCatalogService {
  #services;

  constructor({ serviceModel }) {
    this.#services = serviceModel;
  }

  listAll() {
    return this.#services.find();
  }

  create({ name, description, price, image, duration }) {
    if (typeof name !== 'string' || !name.trim() || typeof price !== 'string' || !price.trim()) {
      throw new ValidationError('El nombre y precio son requeridos.');
    }
    return this.#services.create({ name: name.trim(), description, price: price.trim(), image, duration });
  }

  async update(id, { name, description, price, image, duration }) {
    const updated = await this.#services.findByIdAndUpdate(
      id,
      { name, description, price, image, duration },
      { new: true, runValidators: true }
    );
    if (!updated) throw new NotFoundError('Servicio no encontrado.');
    return updated;
  }

  async delete(id) {
    const deleted = await this.#services.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundError('Servicio no encontrado.');
  }
}
