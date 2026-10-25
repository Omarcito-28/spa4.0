import { AppError } from '../errors/index.js';

// Punto único de respuesta de errores: cualquier subclase de AppError se
// responde igual, con su propio estado HTTP y su representación JSON.
export default class ErrorMiddleware {
  constructor() {
    // Express reconoce un manejador de errores por sus 4 parámetros; bind los conserva.
    this.handle = this.handle.bind(this);
  }

  handle(error, req, res, next) {
    // Errores ajenos a la aplicación (p. ej. JSON mal formado) siguen al manejador de Express.
    if (res.headersSent || !(error instanceof AppError)) return next(error);
    if (error.isServerError) this.#log(req, error);
    res.status(error.status).json(error.toJSON());
  }

  #log(req, error) {
    const detail = error.cause?.message ?? error.message;
    console.error(`${req.method} ${req.originalUrl} -> ${error.status}: ${detail}`);
  }
}
