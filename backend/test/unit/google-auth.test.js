import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import AuthService from '../../src/services/auth.service.js';
import GoogleIdentityService from '../../src/services/google-identity.service.js';
import PasswordHasher from '../../src/services/password-hasher.js';
import TokenService from '../../src/services/token.service.js';
import {
  ConflictError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError
} from '../../src/errors/index.js';

const CLIENT_ID = 'cliente-123.apps.googleusercontent.com';

// Cliente de Google falso: devuelve el payload indicado o falla como un token inválido.
const fakeGoogleClient = payload => ({
  verifyIdToken: vi.fn(async ({ idToken, audience }) => {
    if (idToken !== 'token-valido' || audience !== CLIENT_ID) throw new Error('Invalid token signature');
    return { getPayload: () => payload };
  })
});

const googlePayload = (overrides = {}) => ({
  sub: 'google-sub-1',
  email: 'Ana.Perez@Gmail.com',
  email_verified: true,
  name: 'Ana Pérez',
  ...overrides
});

describe('GoogleIdentityService', () => {
  it('sin Client ID no está configurado', () => {
    expect(new GoogleIdentityService('').isConfigured()).toBe(false);
    expect(new GoogleIdentityService('  ').isConfigured()).toBe(false);
  });

  it('verifica el token contra nuestra audiencia y normaliza el perfil', async () => {
    const client = fakeGoogleClient(googlePayload());
    const google = new GoogleIdentityService(CLIENT_ID, client);

    await expect(google.verify('token-valido')).resolves.toEqual({
      googleId: 'google-sub-1',
      email: 'ana.perez@gmail.com',
      emailVerified: true,
      fullName: 'Ana Pérez'
    });
    expect(client.verifyIdToken).toHaveBeenCalledWith({ idToken: 'token-valido', audience: CLIENT_ID });
  });

  it('rechaza tokens inválidos o ausentes', async () => {
    const google = new GoogleIdentityService(CLIENT_ID, fakeGoogleClient(googlePayload()));
    await expect(google.verify('token-falsificado')).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(google.verify('')).rejects.toBeInstanceOf(ValidationError);
    await expect(google.verify(undefined)).rejects.toBeInstanceOf(ValidationError);
  });

  it('el correo no verificado se informa tal cual', async () => {
    const google = new GoogleIdentityService(CLIENT_ID, fakeGoogleClient(googlePayload({ email_verified: false })));
    await expect(google.verify('token-valido')).resolves.toMatchObject({ emailVerified: false });
  });
});

describe('AuthService con Google', () => {
  let userModel;
  let service;
  const tokenService = new TokenService('secreto-de-prueba-con-32-caracteres!!');

  const withGoogle = payload => new AuthService({
    userModel,
    passwordHasher: new PasswordHasher(4),
    tokenService,
    emailService: { isConfigured: () => false },
    googleIdentity: new GoogleIdentityService(CLIENT_ID, fakeGoogleClient(payload)),
    env: {}
  });

  const document = data => ({ _id: 'user-1', tokenVersion: 0, isActive: true, save: vi.fn(), ...data });

  beforeEach(() => {
    userModel = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn(async data => document(data)),
      findOneAndUpdate: vi.fn()
    };
    service = withGoogle(googlePayload());
  });

  it('publica el Client ID solo cuando Google está configurado', () => {
    expect(service.getProviders()).toEqual({ google: { clientId: CLIENT_ID } });
    const without = new AuthService({ userModel, googleIdentity: new GoogleIdentityService(''), env: {} });
    expect(without.getProviders()).toEqual({ google: null });
  });

  it('sin configurar responde 503', async () => {
    const without = new AuthService({ userModel, googleIdentity: new GoogleIdentityService(''), env: {} });
    await expect(without.loginWithGoogle({ credential: 'token-valido' })).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('crea una cuenta de cliente sin contraseña con el usuario tomado del correo', async () => {
    const result = await service.loginWithGoogle({ credential: 'token-valido' });

    expect(userModel.create).toHaveBeenCalledWith({
      username: 'ana.perez',
      fullName: 'Ana Pérez',
      email: 'ana.perez@gmail.com',
      googleId: 'google-sub-1',
      phoneNumber: '',
      role: 'CLIENT'
    });
    expect(result.isNewUser).toBe(true);
    expect(result.user).toMatchObject({ username: 'ana.perez', role: 'CLIENT', hasPassword: false, googleLinked: true });
    expect(tokenService.verify(result.token)).toMatchObject({ username: 'ana.perez', role: 'CLIENT' });
  });

  it('si el usuario ya existe, agrega un número al final', async () => {
    userModel.findOne.mockImplementation(async query => (query.username === 'ana.perez' ? document({ username: 'ana.perez' }) : null));

    await service.loginWithGoogle({ credential: 'token-valido' });

    expect(userModel.create.mock.calls[0][0].username).toMatch(/^ana\.perez\d{4}$/);
  });

  it('vincula Google a la cuenta existente con el mismo correo, sin cambiar su rol', async () => {
    const stylist = document({
      username: 'laura', email: 'ana.perez@gmail.com', role: 'STYLIST', fullName: 'Laura',
      password: await bcrypt.hash('clave-segura', 4)
    });
    userModel.findOne.mockImplementation(async query => (query.email ? stylist : null));

    const result = await service.loginWithGoogle({ credential: 'token-valido' });

    expect(stylist.googleId).toBe('google-sub-1');
    expect(stylist.save).toHaveBeenCalled();
    expect(userModel.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({ isNewUser: false, user: { username: 'laura', role: 'STYLIST', hasPassword: true, googleLinked: true } });
  });

  it('una cuenta ya vinculada entra por su identificador aunque cambie el correo en el spa', async () => {
    const linked = document({ username: 'ana', email: 'otro@correo.co', googleId: 'google-sub-1', role: 'CLIENT', fullName: 'Ana' });
    userModel.findOne.mockImplementation(async query => (query.googleId === 'google-sub-1' ? linked : null));

    const result = await service.loginWithGoogle({ credential: 'token-valido' });

    expect(result.user.username).toBe('ana');
    expect(linked.save).not.toHaveBeenCalled();
  });

  it('no vincula un correo que Google no verificó', async () => {
    service = withGoogle(googlePayload({ email_verified: false }));
    await expect(service.loginWithGoogle({ credential: 'token-valido' })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(userModel.findOne).not.toHaveBeenCalled();
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('rechaza un correo que ya está vinculado a otra cuenta de Google', async () => {
    userModel.findOne.mockImplementation(async query => (query.email ? document({ username: 'ana', googleId: 'otro-sub' }) : null));
    await expect(service.loginWithGoogle({ credential: 'token-valido' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('no deja entrar a una cuenta desactivada', async () => {
    userModel.findOne.mockImplementation(async query => (query.email ? document({ username: 'ana', isActive: false }) : null));
    await expect(service.loginWithGoogle({ credential: 'token-valido' })).rejects.toThrow('desactivada');
  });

  it('rechaza un token que no es de Google', async () => {
    await expect(service.loginWithGoogle({ credential: 'token-falsificado' })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  describe('cuentas sin contraseña', () => {
    const googleOnly = () => document({ username: 'ana', email: 'ana@correo.co', googleId: 'google-sub-1', role: 'CLIENT', fullName: 'Ana' });

    it('el login con contraseña explica que debe usar Google', async () => {
      userModel.findOne.mockResolvedValue(googleOnly());
      await expect(service.login({ username: 'ana', password: 'cualquier-clave' })).rejects.toThrow('Google');
    });

    it('puede crear su contraseña desde el perfil sin la contraseña actual', async () => {
      userModel.findOne.mockResolvedValue(googleOnly());
      userModel.findOneAndUpdate.mockImplementation(async (_filter, updates) => document({ ...googleOnly(), password: updates.password }));

      const result = await service.updateProfile({ username: 'ana' }, { password: 'nueva-clave-1' });

      const [, updates] = userModel.findOneAndUpdate.mock.calls[0];
      expect(await bcrypt.compare('nueva-clave-1', updates.password)).toBe(true);
      expect(result.user).toMatchObject({ hasPassword: true, googleLinked: true });
    });
  });
});
