import { describe, expect, it, vi } from 'vitest';
import {
  AppError,
  BookingError,
  ConflictError,
  ForbiddenError,
  InvalidSessionError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError
} from '../../src/errors/index.js';
import ErrorMiddleware from '../../src/middlewares/error.middleware.js';
import BaseController from '../../src/controllers/base.controller.js';

const mockResponse = () => {
  const res = { headersSent: false };
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

describe('Jerarquía de errores', () => {
  it.each([
    [ValidationError, 400],
    [UnauthorizedError, 401],
    [ForbiddenError, 403],
    [NotFoundError, 404],
    [ConflictError, 409],
    [BookingError, 409],
    [ServiceUnavailableError, 503]
  ])('%o hereda de AppError con estado %i', (ErrorClass, status) => {
    const error = new ErrorClass('mensaje');
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(status);
    expect(error.name).toBe(ErrorClass.name);
    expect(error.toJSON()).toEqual({ error: 'mensaje' });
  });

  it('BookingError es un tipo de ConflictError', () => {
    expect(new BookingError('x')).toBeInstanceOf(ConflictError);
  });

  it('InvalidSessionError es un 401 que avisa al cliente que cierre la sesión', () => {
    const error = new InvalidSessionError('La sesión expiró.');
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(401);
    expect(error.toJSON()).toEqual({ error: 'La sesión expiró.', code: 'SESSION_INVALID' });
  });

  it('AppError.from conserva los AppError y envuelve los demás como 500', () => {
    const known = new NotFoundError('No está');
    expect(AppError.from(known)).toBe(known);

    const cause = new Error('fallo de base');
    const wrapped = AppError.from(cause, 'No se pudo guardar.');
    expect(wrapped.status).toBe(500);
    expect(wrapped.isServerError).toBe(true);
    expect(wrapped.message).toBe('No se pudo guardar.');
    expect(wrapped.cause).toBe(cause);
  });
});

describe('ErrorMiddleware', () => {
  it('responde cualquier subclase con su estado y su JSON', () => {
    const middleware = new ErrorMiddleware();
    for (const error of [new ValidationError('a'), new ForbiddenError('b'), new BookingError('c')]) {
      const res = mockResponse();
      middleware.handle(error, {}, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(error.status);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    }
  });

  it('delega a Express los errores que no son de la aplicación', () => {
    const next = vi.fn();
    const res = mockResponse();
    const error = new SyntaxError('JSON mal formado');
    new ErrorMiddleware().handle(error, {}, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('conserva los 4 parámetros que Express usa para reconocerlo', () => {
    expect(new ErrorMiddleware().handle).toHaveLength(4);
  });
});

describe('BaseController.handle', () => {
  class DemoController extends BaseController {
    static FAILURE_MESSAGES = { broken: 'No se pudo hacer la demo.' };
    #greeting = 'hola';
    async greet(_req, res) { res.json({ greeting: this.#greeting }); }
    async broken() { throw new Error('boom'); }
    async missing() { throw new NotFoundError('No existe.'); }
  }

  it('conserva `this` al usarse como middleware', async () => {
    const res = mockResponse();
    await new DemoController().handle('greet')({}, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ greeting: 'hola' });
  });

  it('envía al siguiente middleware un 500 con el mensaje propio de la acción', async () => {
    const next = vi.fn();
    await new DemoController().handle('broken')({}, mockResponse(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 500, message: 'No se pudo hacer la demo.' });
  });

  it('deja pasar los AppError sin cambiarlos', async () => {
    const next = vi.fn();
    await new DemoController().handle('missing')({}, mockResponse(), next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
  });

  it('falla al arrancar si la acción no existe', () => {
    expect(() => new DemoController().handle('nope')).toThrow(TypeError);
  });
});
