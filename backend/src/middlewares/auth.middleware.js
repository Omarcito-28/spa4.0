import { ForbiddenError, ServiceUnavailableError, UnauthorizedError } from '../errors/index.js';

export default class AuthMiddleware {
  #users;
  #tokens;

  constructor({ userModel, tokenService }) {
    this.#users = userModel;
    this.#tokens = tokenService;
    // Express invoca los middlewares sin receptor; se fija `this` a esta instancia.
    this.authenticate = this.authenticate.bind(this);
  }

  async authenticate(req, _res, next) {
    let user;
    try {
      user = await this.#resolveUser(req.headers.authorization);
    } catch (error) {
      return next(error);
    }
    req.user = user;
    next();
  }

  requireRole(roles) {
    return (req, _res, next) => {
      if (!req.user) return next(new UnauthorizedError('No autenticado.'));
      if (!roles.includes(req.user.role)) {
        return next(new ForbiddenError('Acceso denegado. Permisos insuficientes.'));
      }
      next();
    };
  }

  async #resolveUser(authorization) {
    const [scheme, token] = authorization?.split(' ') || [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Acceso denegado. Token no proporcionado.');
    }

    let decoded;
    try {
      decoded = this.#tokens.verify(token);
    } catch {
      throw new ForbiddenError('Token inválido o expirado.');
    }

    let user;
    try {
      user = await this.#users.findById(decoded.id).select('username fullName email role isActive tokenVersion');
    } catch (error) {
      throw new ServiceUnavailableError('No se pudo validar la sesión.', { cause: error });
    }
    if (!user) throw new UnauthorizedError('La cuenta asociada a la sesión no existe.');
    if (user.isActive === false) throw new ForbiddenError('La cuenta está desactivada.');
    if ((decoded.tokenVersion || 0) !== user.tokenVersion) {
      throw new ForbiddenError('La sesión expiró. Inicia sesión nuevamente.');
    }
    return {
      id: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
  }
}
