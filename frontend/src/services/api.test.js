import { describe, expect, it } from 'vitest';
import { resolveApiBase, resolveImageUrl } from './api';

describe('resolveApiBase', () => {
  it('usa /api cuando VITE_API_URL no está definida (proxy de Vite en desarrollo)', () => {
    expect(resolveApiBase(undefined)).toBe('/api');
    expect(resolveApiBase('')).toBe('/api');
    expect(resolveApiBase('   ')).toBe('/api');
  });

  it.each([
    'https://essence-api.onrender.com',
    'https://essence-api.onrender.com/',
    'https://essence-api.onrender.com/api',
    'https://essence-api.onrender.com/api/',
    ' https://essence-api.onrender.com ',
  ])('normaliza %s a la base de la API', url => {
    expect(resolveApiBase(url)).toBe('https://essence-api.onrender.com/api');
  });
});

describe('resolveImageUrl', () => {
  it('apunta las imágenes subidas a la API, también en otro dominio', () => {
    expect(resolveImageUrl('/api/service-images/abc', '/api')).toBe('/api/service-images/abc');
    expect(resolveImageUrl('/api/service-images/abc', 'https://essence-api.onrender.com/api'))
      .toBe('https://essence-api.onrender.com/api/service-images/abc');
  });

  it('deja igual las imágenes públicas del frontend y las URL completas', () => {
    expect(resolveImageUrl('/images/services/masaje.jpg', 'https://x.test/api')).toBe('/images/services/masaje.jpg');
    expect(resolveImageUrl('https://cdn.test/a.png', 'https://x.test/api')).toBe('https://cdn.test/a.png');
    expect(resolveImageUrl('', 'https://x.test/api')).toBe('');
  });
});
