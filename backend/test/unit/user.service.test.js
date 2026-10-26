import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserService from '../../src/services/user.service.js';
import { ConflictError, NotFoundError, ValidationError } from '../../src/errors/index.js';

const ADMIN = { id: 'admin-1', username: 'admin', role: 'ADMIN' };
const selectResolving = value => ({ select: vi.fn().mockResolvedValue(value) });
const userDoc = overrides => ({
  _id: { toString: () => overrides.id ?? 'user-1' },
  username: 'ana',
  role: 'CLIENT',
  ...overrides
});
const week = () => [0, 1, 2, 3, 4, 5, 6].map(day => ({ day, enabled: day > 0, start: '09:00', end: '17:00' }));

describe('UserService', () => {
  let userModel;
  let appointmentModel;
  let users;

  beforeEach(() => {
    userModel = {
      find: vi.fn(() => selectResolving([])),
      findById: vi.fn().mockResolvedValue(userDoc({})),
      findByIdAndUpdate: vi.fn(() => selectResolving({ username: 'ana' })),
      findByIdAndDelete: vi.fn().mockResolvedValue({}),
      countDocuments: vi.fn().mockResolvedValue(2)
    };
    appointmentModel = { exists: vi.fn().mockResolvedValue(null) };
    users = new UserService({ userModel, appointmentModel, clock: { today: () => '2026-05-10' } });
  });

  describe('update (edición desde el panel de administrador)', () => {
    it('edita rol, nombre, correo y estado con los datos normalizados', async () => {
      await users.update('user-1', { role: 'STYLIST', fullName: ' Ana P ', email: ' ANA@X.CO ', isActive: true }, ADMIN);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-1',
        { role: 'STYLIST', fullName: 'Ana P', email: 'ana@x.co', isActive: true },
        { new: true, runValidators: true }
      );
    });

    it.each([
      ['rol desconocido', { role: 'JEFE' }, 'El rol no es válido.'],
      ['nombre vacío', { fullName: '  ' }, 'El nombre no puede quedar vacío.'],
      ['correo inválido', { email: 'ana' }, 'El correo electrónico no es válido.'],
      ['estado no booleano', { isActive: 'no' }, 'El estado de la cuenta no es válido.']
    ])('rechaza %s', async (_case, data, message) => {
      await expect(users.update('user-1', data, ADMIN)).rejects.toThrow(new ValidationError(message));
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('responde 404 si el usuario no existe', async () => {
      userModel.findById.mockResolvedValue(null);
      await expect(users.update('nada', {}, ADMIN)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('impide que el administrador cambie su propio rol o se desactive', async () => {
      userModel.findById.mockResolvedValue(userDoc({ id: 'admin-1', role: 'ADMIN' }));

      await expect(users.update('admin-1', { role: 'CLIENT' }, ADMIN)).rejects.toBeInstanceOf(ValidationError);
      await expect(users.update('admin-1', { isActive: false }, ADMIN)).rejects.toBeInstanceOf(ValidationError);
    });

    it('protege al último administrador activo', async () => {
      userModel.findById.mockResolvedValue(userDoc({ id: 'admin-2', role: 'ADMIN' }));
      userModel.countDocuments.mockResolvedValue(1);

      await expect(users.update('admin-2', { role: 'CLIENT' }, ADMIN))
        .rejects.toThrow(new ConflictError('No se puede cambiar el rol del último administrador.'));
    });

    it('no cambia el rol de un estilista con citas activas', async () => {
      userModel.findById.mockResolvedValue(userDoc({ username: 'sofi', role: 'STYLIST' }));
      appointmentModel.exists.mockResolvedValue({ _id: 'cita-1' });

      await expect(users.update('user-1', { role: 'CLIENT' }, ADMIN)).rejects.toBeInstanceOf(ConflictError);
      expect(appointmentModel.exists).toHaveBeenCalledWith({
        stylist: 'sofi',
        status: { $in: ['PENDING', 'CONFIRMED'] },
        date: { $gte: '2026-05-10' }
      });
    });

    it('desactiva a un estilista sin citas próximas', async () => {
      userModel.findById.mockResolvedValue(userDoc({ username: 'sofi', role: 'STYLIST' }));

      await users.update('user-1', { isActive: false }, ADMIN);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user-1', { isActive: false }, { new: true, runValidators: true });
    });

    it('traduce un correo duplicado a 409', async () => {
      userModel.findByIdAndUpdate.mockReturnValue({
        select: vi.fn().mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 }))
      });
      await expect(users.update('user-1', { email: 'otro@x.co' }, ADMIN))
        .rejects.toThrow(new ConflictError('Ese correo ya está asociado a otra cuenta.'));
    });
  });

  describe('create (alta desde el panel de administrador)', () => {
    const newStylist = { username: ' Sofi ', password: 'clave-segura', fullName: ' Sofía P ', email: ' SOFI@X.CO ', phoneNumber: ' 300 ', role: 'STYLIST' };
    let passwordHasher;

    beforeEach(() => {
      passwordHasher = { hash: vi.fn().mockResolvedValue('hash') };
      userModel.findOne = vi.fn().mockResolvedValue(null);
      userModel.create = vi.fn().mockResolvedValue({ _id: 'nuevo-1' });
      userModel.findById = vi.fn(() => selectResolving({ username: 'sofi', role: 'STYLIST' }));
      users = new UserService({ userModel, appointmentModel, passwordHasher });
    });

    it('crea la cuenta con el rol elegido, datos normalizados y la contraseña cifrada', async () => {
      await expect(users.create(newStylist)).resolves.toEqual({ username: 'sofi', role: 'STYLIST' });

      expect(passwordHasher.hash).toHaveBeenCalledWith('clave-segura');
      expect(userModel.create).toHaveBeenCalledWith({
        username: 'sofi', password: 'hash', fullName: 'Sofía P', email: 'sofi@x.co', phoneNumber: '300', role: 'STYLIST'
      });
      expect(userModel.findById).toHaveBeenCalledWith('nuevo-1');
    });

    it('usa CLIENT si no se indica rol', async () => {
      const { role: _role, ...withoutRole } = newStylist;
      await users.create(withoutRole);
      expect(userModel.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'CLIENT' }));
    });

    it.each([
      ['rol desconocido', { role: 'JEFE' }, 'El rol no es válido.'],
      ['contraseña corta', { password: '123' }, 'La contraseña debe tener al menos 8 caracteres.'],
      ['correo inválido', { email: 'sofi' }, 'El correo electrónico no es válido.'],
      ['nombre vacío', { fullName: ' ' }, 'Todos los campos son obligatorios.']
    ])('rechaza %s', async (_case, overrides, message) => {
      await expect(users.create({ ...newStylist, ...overrides })).rejects.toThrow(new ValidationError(message));
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it.each([
      ['el usuario', { username: 'sofi', email: 'otra@x.co' }, 'El nombre de usuario ya existe.'],
      ['el correo', { username: 'otra', email: 'sofi@x.co' }, 'El correo electrónico ya está registrado.']
    ])('responde 409 si %s ya existe', async (_case, existing, message) => {
      userModel.findOne.mockResolvedValue(existing);
      await expect(users.create(newStylist)).rejects.toThrow(new ConflictError(message));
      expect(userModel.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('borra una cuenta sin citas', async () => {
      await users.delete('user-1', ADMIN);
      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith('user-1');
    });

    it('impide borrar la propia cuenta', async () => {
      await expect(users.delete('admin-1', ADMIN)).rejects.toBeInstanceOf(ValidationError);
      expect(userModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('responde 404 si la cuenta no existe', async () => {
      userModel.findById.mockResolvedValue(null);
      await expect(users.delete('nada', ADMIN)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('no borra al último administrador', async () => {
      userModel.findById.mockResolvedValue(userDoc({ role: 'ADMIN' }));
      userModel.countDocuments.mockResolvedValue(1);
      await expect(users.delete('user-1', ADMIN)).rejects.toBeInstanceOf(ConflictError);
    });

    it('no borra una cuenta con citas asociadas', async () => {
      appointmentModel.exists.mockResolvedValue({ _id: 'cita-1' });
      await expect(users.delete('user-1', ADMIN))
        .rejects.toThrow('La cuenta tiene citas registradas y se conserva para no perder el historial. Desactívala en su lugar.');
      expect(userModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('horario semanal del estilista', () => {
    it('guarda un horario de 7 días válido', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(selectResolving({ weeklySchedule: week() }));
      await expect(users.updateSchedule('sofi-1', week())).resolves.toHaveLength(7);
    });

    it.each([
      ['no es una lista', 'lunes'],
      ['faltan días', week().slice(0, 6)],
      ['días desordenados', week().reverse()],
      ['hora mal escrita', week().map(d => (d.day === 1 ? { ...d, start: '9:00' } : d))],
      ['inicio después del fin', week().map(d => (d.day === 1 ? { ...d, start: '18:00' } : d))]
    ])('rechaza un horario cuando %s', async (_case, days) => {
      await expect(users.updateSchedule('sofi-1', days)).rejects.toThrow(new ValidationError('El horario semanal no es válido.'));
    });

    it('permite un día deshabilitado aunque sus horas no tengan sentido', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(selectResolving({ weeklySchedule: [] }));
      const days = week().map(d => (d.day === 0 ? { ...d, enabled: false, start: '18:00', end: '08:00' } : d));
      await expect(users.updateSchedule('sofi-1', days)).resolves.toEqual([]);
    });

    it('getSchedule responde 404 si el usuario no existe', async () => {
      userModel.findById.mockReturnValue(selectResolving(null));
      await expect(users.getSchedule('nada')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
