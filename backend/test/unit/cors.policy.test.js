import { describe, expect, it } from 'vitest';
import CorsPolicy from '../../src/middlewares/cors.policy.js';

describe('CorsPolicy', () => {
  it('acepta el FRONTEND_URL y los CORS_ORIGINS adicionales', () => {
    const policy = CorsPolicy.fromEnv({
      FRONTEND_URL: 'https://essence.vercel.app/',
      CORS_ORIGINS: ' https://www.essence.co , https://otra.example ',
    });

    expect(policy.origins).toEqual(['https://essence.vercel.app', 'https://www.essence.co', 'https://otra.example']);
    expect(policy.isAllowed('https://essence.vercel.app')).toBe(true);
    expect(policy.isAllowed('https://WWW.essence.co')).toBe(true);
  });

  it('rechaza orígenes que no están en la lista', () => {
    const policy = CorsPolicy.fromEnv({ FRONTEND_URL: 'https://essence.vercel.app' });
    expect(policy.isAllowed('https://sitio-malicioso.example')).toBe(false);
    expect(policy.isAllowed('https://essence.vercel.app.evil.example')).toBe(false);
  });

  it('acepta peticiones sin Origin, como el health check de Render', () => {
    expect(CorsPolicy.fromEnv({ FRONTEND_URL: 'https://essence.vercel.app' }).isAllowed(undefined)).toBe(true);
  });

  it('sin orígenes configurados acepta cualquiera (desarrollo local)', () => {
    const policy = CorsPolicy.fromEnv({});
    expect(policy.allowsAnyOrigin).toBe(true);
    expect(policy.isAllowed('http://localhost:5173')).toBe(true);
  });

  it('entrega las opciones que espera el paquete cors', () => {
    const { origin } = new CorsPolicy(['https://essence.vercel.app']).toOptions();
    const results = [];
    origin('https://essence.vercel.app', (_error, allowed) => results.push(allowed));
    origin('https://otro.example', (_error, allowed) => results.push(allowed));
    expect(results).toEqual([true, false]);
  });
});
