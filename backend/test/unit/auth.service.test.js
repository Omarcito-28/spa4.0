import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import AuthService from '../../src/services/auth.service.js';
import PasswordHasher from '../../src/services/password-hasher.js';
import TokenService from '../../src/services/token.service.js';
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError
} from '../../src/errors/index.js';

const validRegistration = {
  username: '  Ana ',
  password: 'clave-segura',
  fullName: ' Ana Pérez ',
  email: ' ANA@Correo.co ',
  phoneNumber: ' 300 123 4567 '
};

describe('AuthService', () => {
  let userModel;
  let emailService;
  let tokenService;
  let hasher;
  let service;

  beforeEach(() => {
    userModel = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn(async data => ({ _id: 'user-1', tokenVersion: 0, ...data })),
      findOneAndUpdate: vi.fn()
    };
    emailService = { isConfigured: vi.fn(() => true), send: vi.fn() };
    tokenService = new TokenService('secreto-de-prueba-con-32-caracteres!!');
    // 4 rondas para que las pruebas sean rápidas.
    hasher = new PasswordHasher(4);
    service = new AuthService({ userModel, passwordHasher: hasher, tokenService, emailService, env: {} });
  });

  const storedUser = async (overrides = {}) => ({
    _id: 'user-1',
    username: 'ana',
    fullName: 'Ana Pérez',
    email: 'ana@correo.co',
    phoneNumber: '300',
    role: 'CLIENT',
    tokenVersion: 0,
    password: await bcrypt.hash('clave-segura', 4),
    ...overrides
  });

  describe('register', () => {
    it('crea un cliente con los datos normalizados y devuelve sesión', async () => {
      const result = await service.register(validRegistration);

      expect(userModel.create).toHaveBeenCalledWith(expect.objectContaining({
        username: 'ana',
        fullName: 'Ana Pérez',
        email: 'ana@correo.co',
        phoneNumber: '300 123 4567',
        role: 'CLIENT'
      }));
      expect(result.user).toEqual({
        username: 'ana',
        fullName: 'Ana Pérez',
        email: 'ana@correo.co',
        phoneNumber: '300 123 4567',
        role: 'CLIENT'
      });
      expect(tokenService.verify(result.token)).toMatchObject({ username: 'ana', role: 'CLIENT' });
    });

    it('guarda la contraseña con hash bcrypt y nunca en texto plano', async () => {
      await service.register(validRegistration);
      const { password } = userModel.create.mock.calls[0][0];

      expect(password).not.toBe(validRegistration.password);
      expect(password).toMatch(/^\$2[aby]\$/);
      expect(await bcrypt.compare(validRegistration.password, password)).toBe(true);
    });

    it('no deja que el cliente elija su rol', async () => {
      await service.register({ ...validRegistration, role: 'ADMIN' });
      expect(userModel.create.mock.calls[0][0].role).toBe('CLIENT');
    });

    it.each([
      ['falta el usuario', { username: '' }, 'Todos los campos son obligatorios.'],
      ['usuario no es texto', { username: 42 }, 'Todos los campos son obligatorios.'],
      ['falta el nombre', { fullName: '   ' }, 'Todos los campos son obligatorios.'],
      ['falta el correo', { email: undefined }, 'Todos los campos son obligatorios.'],
      ['contraseña corta', { password: '1234567' }, 'La contraseña debe tener al menos 8 caracteres.'],
      ['correo inválido', { email: 'ana@correo' }, 'El correo electrónico no es válido.']
    ])('rechaza el registro cuando %s', async (_case, overrides, message) => {
      const error = await service.register({ ...validRegistration, ...overrides }).catch(e => e);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.status).toBe(400);
      expect(error.message).toBe(message);
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('rechaza un nombre de usuario repetido', async () => {
      userModel.findOne.mockResolvedValue({ username: 'ana', email: 'otra@correo.co' });

      await expect(service.register(validRegistration))
        .rejects.toThrow(new ConflictError('El nombre de usuario ya existe.'));
      expect(userModel.findOne).toHaveBeenCalledWith({
        $or: [{ username: 'ana' }, { email: 'ana@correo.co' }]
      });
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('rechaza un correo ya registrado', async () => {
      userModel.findOne.mockResolvedValue({ username: 'otra', email: 'ana@correo.co' });

      const error = await service.register(validRegistration).catch(e => e);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('El correo electrónico ya está registrado.');
    });

    it('traduce el índice único de MongoDB (registro simultáneo) a 409', async () => {
      userModel.create.mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 }));

      const error = await service.register(validRegistration).catch(e => e);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.status).toBe(409);
    });
  });

  describe('login', () => {
    it('inicia sesión con usuario o correo y la contraseña correcta', async () => {
      userModel.findOne.mockResolvedValue(await storedUser());

      const result = await service.login({ username: ' ANA@correo.co ', password: 'clave-segura' });

      expect(userModel.findOne).toHaveBeenCalledWith({
        $or: [{ username: 'ana@correo.co' }, { email: 'ana@correo.co' }]
      });
      expect(result.user.username).toBe('ana');
      expect(result.user).not.toHaveProperty('password');
      expect(tokenService.verify(result.token)).toMatchObject({ id: 'user-1', tokenVersion: 0 });
    });

    it('rechaza una contraseña incorrecta', async () => {
      userModel.findOne.mockResolvedValue(await storedUser());

      await expect(service.login({ username: 'ana', password: 'otra-clave' }))
        .rejects.toThrow(new UnauthorizedError('Credenciales inválidas.'));
    });

    it('responde igual cuando el usuario no existe', async () => {
      const error = await service.login({ username: 'nadie', password: 'clave-segura' }).catch(e => e);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Credenciales inválidas.');
    });

    it('rechaza una cuenta desactivada', async () => {
      userModel.findOne.mockResolvedValue(await storedUser({ isActive: false }));

      await expect(service.login({ username: 'ana', password: 'clave-segura' }))
        .rejects.toThrow('La cuenta está desactivada. Contacta al administrador.');
    });

    it.each([{}, { username: 'ana' }, { username: '  ', password: 'x' }, { username: 'ana', password: 5 }])(
      'exige usuario y contraseña (%o)', async credentials => {
        await expect(service.login(credentials)).rejects.toBeInstanceOf(ValidationError);
        expect(userModel.findOne).not.toHaveBeenCalled();
      });
  });

  describe('perfil y recuperación', () => {
    it('getProfile responde 404 si el usuario ya no existe', async () => {
      userModel.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      await expect(service.getProfile({ username: 'ana' })).rejects.toBeInstanceOf(NotFoundError);
    });

    it('updateProfile exige la contraseña actual para cambiarla', async () => {
      userModel.findOne.mockResolvedValue(await storedUser());

      await expect(service.updateProfile({ username: 'ana' }, { password: 'nueva-clave', currentPassword: 'mala' }))
        .rejects.toThrow(new UnauthorizedError('La contraseña actual no es correcta.'));
      expect(userModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('updateProfile guarda la nueva contraseña con hash e invalida sesiones anteriores', async () => {
      userModel.findOne.mockResolvedValue(await storedUser());
      userModel.findOneAndUpdate.mockReturnValue({ select: vi.fn().mockResolvedValue(await storedUser({ tokenVersion: 1 })) });

      await service.updateProfile({ username: 'ana' }, { password: 'nueva-clave', currentPassword: 'clave-segura' });

      const updates = userModel.findOneAndUpdate.mock.calls[0][1];
      expect(await bcrypt.compare('nueva-clave', updates.password)).toBe(true);
      expect(updates.$inc).toEqual({ tokenVersion: 1 });
    });

    it('requestPasswordReset responde 503 si el correo no está configurado', async () => {
      emailService.isConfigured.mockReturnValue(false);
      await expect(service.requestPasswordReset('ana@correo.co')).rejects.toBeInstanceOf(ServiceUnavailableError);
    });

    it('requestPasswordReset no revela si el correo existe', async () => {
      const unknown = await service.requestPasswordReset('nadie@correo.co');
      userModel.findOne.mockResolvedValue({ ...(await storedUser()), save: vi.fn() });
      const known = await service.requestPasswordReset('ana@correo.co');

      expect(known).toBe(unknown);
      expect(emailService.send).toHaveBeenCalledTimes(1);
      expect(emailService.send.mock.calls[0][0].text).toMatch(/reset-password\?token=[0-9a-f]{64}/);
    });

    it('resetPassword rechaza un enlace con formato inválido', async () => {
      await expect(service.resetPassword({ token: 'corto', password: 'nueva-clave' }))
        .rejects.toBeInstanceOf(ValidationError);
    });
  });
});
