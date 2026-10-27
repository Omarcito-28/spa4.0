import AppError from '../errors/app.error.js';

class TooManyAttemptsError extends AppError {
  constructor(message, retryAfterSeconds) {
    super(message, 429);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Frena los intentos de adivinar contraseñas: tras `maxFailures` inicios de sesión
// fallidos del mismo usuario desde la misma IP dentro de la ventana, bloquea hasta
// que la ventana termine. Además limita el total de fallos por IP, para quien
// prueba muchos usuarios distintos. Un inicio exitoso limpia el contador del usuario.
// Vive en memoria: con varias instancias del servidor, cada una cuenta por su lado.
export default class LoginRateLimiter {
  #maxFailures;
  #maxFailuresPerIp;
  #windowMs;
  #now;
  #failures = new Map();

  constructor({ maxFailures = 5, maxFailuresPerIp = 30, windowMs = 15 * 60 * 1000, now = Date.now } = {}) {
    this.#maxFailures = maxFailures;
    this.#maxFailuresPerIp = maxFailuresPerIp;
    this.#windowMs = windowMs;
    this.#now = now;
    this.handle = this.handle.bind(this);
  }

  handle(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'desconocida';
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const keys = { user: `user:${ip}:${username}`, ip: `ip:${ip}` };

    const blockedFor = Math.max(
      this.#retryAfter(keys.user, this.#maxFailures),
      this.#retryAfter(keys.ip, this.#maxFailuresPerIp)
    );
    if (blockedFor > 0) {
      const minutes = Math.ceil(blockedFor / 60);
      res.set('Retry-After', String(blockedFor));
      return next(new TooManyAttemptsError(
        `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} o recupera tu contraseña.`,
        blockedFor
      ));
    }

    res.on('finish', () => {
      if (res.statusCode === 401) {
        this.#record(keys.user);
        this.#record(keys.ip);
      } else if (res.statusCode < 400) {
        this.#failures.delete(keys.user);
      }
    });
    next();
  }

  #record(key) {
    const now = this.#now();
    const entry = this.#failures.get(key);
    if (!entry || now - entry.firstAt >= this.#windowMs) {
      this.#failures.set(key, { count: 1, firstAt: now });
    } else {
      entry.count += 1;
    }
    this.#prune(now);
  }

  // Segundos que faltan de bloqueo, o 0 si la clave puede intentar.
  #retryAfter(key, limit) {
    const entry = this.#failures.get(key);
    if (!entry) return 0;
    const elapsed = this.#now() - entry.firstAt;
    if (elapsed >= this.#windowMs) {
      this.#failures.delete(key);
      return 0;
    }
    return entry.count >= limit ? Math.ceil((this.#windowMs - elapsed) / 1000) : 0;
  }

  // Evita que el mapa crezca sin límite con claves vencidas.
  #prune(now) {
    if (this.#failures.size < 10000) return;
    for (const [key, entry] of this.#failures) {
      if (now - entry.firstAt >= this.#windowMs) this.#failures.delete(key);
    }
  }
}
