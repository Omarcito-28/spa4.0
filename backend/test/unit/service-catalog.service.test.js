import { beforeEach, describe, expect, it, vi } from 'vitest';
import ServiceCatalogService from '../../src/services/service-catalog.service.js';
import { ConflictError, NotFoundError, ValidationError } from '../../src/errors/index.js';

describe('ServiceCatalogService', () => {
  let serviceModel;
  let appointmentModel;
  let catalog;

  beforeEach(() => {
    serviceModel = {
      find: vi.fn().mockResolvedValue([{ name: 'Corte' }]),
      create: vi.fn(async data => ({ _id: 'svc-1', ...data })),
      findById: vi.fn().mockResolvedValue({ _id: 'svc-1', name: 'Corte' }),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn().mockResolvedValue({ _id: 'svc-1' })
    };
    appointmentModel = { exists: vi.fn().mockResolvedValue(null) };
    catalog = new ServiceCatalogService({ serviceModel, appointmentModel, clock: { today: () => '2026-05-10' } });
  });

  it('lista todos los servicios para el administrador', async () => {
    await expect(catalog.listAll()).resolves.toEqual([{ name: 'Corte' }]);
    expect(serviceModel.find).toHaveBeenCalledWith();
  });

  it('el catálogo público solo lista los servicios activos', async () => {
    await catalog.listActive();
    expect(serviceModel.find).toHaveBeenCalledWith({ isActive: { $ne: false } });
  });

  describe('create', () => {
    it('crea un servicio con nombre y precio sin espacios sobrantes', async () => {
      const created = await catalog.create({ name: ' Uñas Gel ', price: ' $40.000 ', description: 'Esmaltado', duration: 45 });

      expect(serviceModel.create).toHaveBeenCalledWith({
        name: 'Uñas Gel', price: '$40.000', description: 'Esmaltado', image: undefined, duration: 45
      });
      expect(created._id).toBe('svc-1');
    });

    it.each([
      ['sin nombre', { price: '$1' }],
      ['nombre vacío', { name: '   ', price: '$1' }],
      ['sin precio', { name: 'Corte' }],
      ['precio numérico', { name: 'Corte', price: 1000 }]
    ])('rechaza un servicio %s', (_case, data) => {
      expect(() => catalog.create(data)).toThrow(new ValidationError('El nombre y precio son requeridos.'));
      expect(serviceModel.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('edita el servicio y aplica las validaciones del esquema', async () => {
      serviceModel.findByIdAndUpdate.mockResolvedValue({ _id: 'svc-1', name: 'Corte Premium' });

      const updated = await catalog.update('svc-1', { name: 'Corte Premium', price: '$50.000', extra: 'ignorado' });

      expect(updated.name).toBe('Corte Premium');
      const [id, changes, options] = serviceModel.findByIdAndUpdate.mock.calls[0];
      expect(id).toBe('svc-1');
      expect(changes).not.toHaveProperty('extra');
      expect(options).toMatchObject({ new: true, runValidators: true });
    });

    it('oculta o vuelve a publicar el servicio', async () => {
      serviceModel.findByIdAndUpdate.mockResolvedValue({ _id: 'svc-1', isActive: false });
      await catalog.update('svc-1', { isActive: false });
      expect(serviceModel.findByIdAndUpdate.mock.calls[0][1]).toMatchObject({ isActive: false });
    });

    it('rechaza un estado que no es booleano', async () => {
      await expect(catalog.update('svc-1', { isActive: 'no' })).rejects.toBeInstanceOf(ValidationError);
      expect(serviceModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('responde 404 si el servicio no existe', async () => {
      serviceModel.findByIdAndUpdate.mockResolvedValue(null);
      await expect(catalog.update('nada', { name: 'X' })).rejects.toThrow(new NotFoundError('Servicio no encontrado.'));
    });
  });

  describe('delete', () => {
    it('borra un servicio sin citas próximas', async () => {
      await expect(catalog.delete('svc-1')).resolves.toBeUndefined();
      expect(appointmentModel.exists).toHaveBeenCalledWith({
        service: 'Corte',
        status: { $in: ['PENDING', 'CONFIRMED'] },
        date: { $gte: '2026-05-10' }
      });
      expect(serviceModel.findByIdAndDelete).toHaveBeenCalledWith('svc-1');
    });

    it('impide borrar un servicio con citas próximas', async () => {
      appointmentModel.exists.mockResolvedValue({ _id: 'cita-1' });
      await expect(catalog.delete('svc-1')).rejects.toBeInstanceOf(ConflictError);
      expect(serviceModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('responde 404 si el servicio ya no existe', async () => {
      serviceModel.findById.mockResolvedValue(null);
      await expect(catalog.delete('svc-1')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
