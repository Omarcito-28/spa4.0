import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import LoginRateLimiter from '../../src/middlewares/login-rate-limiter.js';

// Simula una petición de login que termina con el estado indicado.
const attempt = (limiter, { ip = '1.1.1.1', username = 'ana', status = 401 } = {}) => {
  const res = new EventEmitter();
  res.set = vi.fn();
  const next = vi.fn();
  limiter.handle({ ip, body: { username } }, res, next);
  const error = next.mock.calls[0]?.[0];
  if (!error) {
    res.statusCode = status;
    res.emit('finish');
  }
  return { error, res };
};

describe('LoginRateLimiter', () => {
  it('bloquea tras 5 fallos del mismo usuario y vuelve a permitir al terminar la ventana', () => {
    let now = 0;
    const limiter = new LoginRateLimiter({ now: () => now });
    for (let i = 0; i < 5; i += 1) expect(attempt(limiter).error).toBeUndefined();

    const blocked = attempt(limiter);
    expect(blocked.error.status).toBe(429);
    expect(blocked.error.message).toBe('Demasiados intentos fallidos. Intenta de nuevo en 15 minutos o recupera tu contraseña.');
    expect(blocked.res.set).toHaveBeenCalledWith('Retry-After', '900');
    // Otro usuario desde la misma IP todavía puede intentar.
    expect(attempt(limiter, { username: 'luis' }).error).toBeUndefined();

    now = 15 * 60 * 1000;
    expect(attempt(limiter).error).toBeUndefined();
  });

  it('un inicio de sesión exitoso reinicia el contador del usuario', () => {
    const limiter = new LoginRateLimiter({ now: () => 0 });
    for (let i = 0; i < 4; i += 1) attempt(limiter);
    attempt(limiter, { status: 200 });
    for (let i = 0; i < 4; i += 1) expect(attempt(limiter).error).toBeUndefined();
  });

  it('limita el total de fallos por IP aunque se prueben usuarios distintos', () => {
    const limiter = new LoginRateLimiter({ maxFailuresPerIp: 3, now: () => 0 });
    attempt(limiter, { username: 'a' });
    attempt(limiter, { username: 'b' });
    attempt(limiter, { username: 'c' });
    expect(attempt(limiter, { username: 'd' }).error.status).toBe(429);
    expect(attempt(limiter, { ip: '2.2.2.2', username: 'd' }).error).toBeUndefined();
  });
});
