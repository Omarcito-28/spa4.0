import UnauthorizedError from './unauthorized.error.js';

// La sesión guardada en el cliente ya no sirve (token vencido o revocado, cuenta
// desactivada o eliminada). El código le indica al frontend que debe cerrarla.
export default class InvalidSessionError extends UnauthorizedError {
  static CODE = 'SESSION_INVALID';

  toJSON() {
    return { ...super.toJSON(), code: InvalidSessionError.CODE };
  }
}
