import { describe, expect, it } from 'vitest';
import { resolveApiBase } from './api';

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
