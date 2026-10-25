import { AppError } from '../errors/index.js';

export default class BaseController {
  static DEFAULT_FAILURE_MESSAGE = 'Error interno del servidor.';
  // Las subclases pueden personalizar el mensaje 500 de cada acción.
  static FAILURE_MESSAGES = {};

  // Devuelve la acción como middleware de Express: conserva `this` y envía
  // los errores al ErrorMiddleware en lugar de repetir try/catch en cada método.
  handle(action) {
    if (typeof this[action] !== 'function') {
      throw new TypeError(`${this.constructor.name} no tiene la acción "${action}".`);
    }
    const method = this[action].bind(this);
    const fallbackMessage = this.constructor.FAILURE_MESSAGES[action] ?? BaseController.DEFAULT_FAILURE_MESSAGE;
    return async (req, res, next) => {
      try {
        await method(req, res);
      } catch (error) {
        next(AppError.from(error, fallbackMessage));
      }
    };
  }
}
