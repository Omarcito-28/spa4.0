import { ConflictError, NotFoundError, ValidationError } from '../errors/index.js';

// Catálogo de servicios que ofrece el spa. Un servicio oculto (isActive: false)
// no aparece en el catálogo público ni se puede reservar, pero conserva su historial.
export default class ServiceCatalogService {
  #services;
  #appointments;
  #clock;

  constructor({ serviceModel, appointmentModel, clock }) {
    this.#services = serviceModel;
    this.#appointments = appointmentModel;
    this.#clock = clock;
  }

  listActive() {
    return this.#services.find({ isActive: { $ne: false } });
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

  async update(id, { name, description, price, image, duration, isActive }) {
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      throw new ValidationError('El estado del servicio no es válido.');
    }
    const updated = await this.#services.findByIdAndUpdate(
      id,
      { name, description, price, image, duration, isActive },
      { new: true, runValidators: true }
    );
    if (!updated) throw new NotFoundError('Servicio no encontrado.');
    return updated;
  }

  // Las citas guardan el nombre del servicio, así que borrarlo no pierde el
  // historial; solo se impide si todavía hay citas por atender.
  async delete(id) {
    const service = await this.#services.findById(id);
    if (!service) throw new NotFoundError('Servicio no encontrado.');
    if (await this.#appointments.exists({
      service: service.name,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      date: { $gte: this.#clock.today() }
    })) {
      throw new ConflictError('El servicio tiene citas próximas. Ocúltalo del catálogo para que no se reserve más, o cancela esas citas antes de eliminarlo.');
    }
    await this.#services.findByIdAndDelete(id);
  }
}
