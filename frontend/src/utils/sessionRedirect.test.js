import { describe, expect, it } from 'vitest';
import { pathAfterLogin } from './sessionRedirect';

describe('pathAfterLogin', () => {
  it('cada rol va a su panel', () => {
    expect(pathAfterLogin({ role: 'ADMIN' })).toBe('/admin');
    expect(pathAfterLogin({ role: 'STYLIST' })).toBe('/stylist');
    expect(pathAfterLogin({ role: 'CLIENT' })).toBe('/dashboard');
  });

  it('un cliente nuevo va a completar su perfil', () => {
    expect(pathAfterLogin({ role: 'CLIENT' }, { isNewUser: true })).toBe('/profile');
  });

  it('si venía de reservar, vuelve a la reserva; otra ruta no se respeta', () => {
    expect(pathAfterLogin({ role: 'CLIENT' }, { returnTo: '/appointments/new?service=Corte', isNewUser: true }))
      .toBe('/appointments/new?service=Corte');
    expect(pathAfterLogin({ role: 'CLIENT' }, { returnTo: 'https://otro-sitio.com' })).toBe('/dashboard');
    expect(pathAfterLogin({ role: 'CLIENT' }, { returnTo: '/appointments/newhttps://x' })).toBe('/dashboard');
  });

  it('si quería ver sus citas, vuelve a sus citas', () => {
    expect(pathAfterLogin({ role: 'CLIENT' }, { returnTo: '/appointments/my' })).toBe('/appointments/my');
    expect(pathAfterLogin({ role: 'ADMIN' }, { returnTo: '/appointments/my' })).toBe('/admin');
  });
});
