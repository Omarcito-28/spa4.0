// Clase base de los errores de la aplicación: cada error conoce su estado HTTP
// y cómo representarse en la respuesta JSON.
export default class AppError extends Error {
  #status;

  constructor(message, status = 500, options) {
    super(message, options);
    this.name = new.target.name;
    this.#status = status;
  }

  get status() {
    return this.#status;
  }

  get isServerError() {
    return this.#status >= 500;
  }

  toJSON() {
    return { error: this.message };
  }

  // Convierte cualquier error inesperado en un AppError 500 con un mensaje seguro.
  static from(error, fallbackMessage = 'Error interno del servidor.') {
    if (error instanceof AppError) return error;
    return new AppError(fallbackMessage, 500, { cause: error });
  }
}
