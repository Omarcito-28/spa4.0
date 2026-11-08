import { OAuth2Client } from 'google-auth-library';
import { UnauthorizedError, ValidationError } from '../errors/index.js';

// Verifica el token de identidad (ID token) que Google Identity Services entrega
// al navegador cuando la persona elige su cuenta. La firma, el emisor, la
// audiencia (nuestro GOOGLE_CLIENT_ID) y la expiración se comprueban con las
// claves públicas de Google: el frontend no puede inventar ni reutilizar uno ajeno.
export default class GoogleIdentityService {
  #clientId;
  #client;

  constructor(clientId, client) {
    this.#clientId = (clientId || '').trim();
    this.#client = client ?? (this.#clientId ? new OAuth2Client(this.#clientId) : null);
  }

  get clientId() {
    return this.#clientId;
  }

  isConfigured() {
    return Boolean(this.#clientId && this.#client);
  }

  async verify(credential) {
    if (typeof credential !== 'string' || !credential || credential.length > 4096) {
      throw new ValidationError('Falta la credencial de Google.');
    }
    let payload;
    try {
      const ticket = await this.#client.verifyIdToken({ idToken: credential, audience: this.#clientId });
      payload = ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedError('No se pudo verificar tu cuenta de Google. Intenta de nuevo.', { cause: error });
    }
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedError('Google no compartió el correo de la cuenta.');
    }
    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      emailVerified: payload.email_verified === true,
      fullName: (payload.name || '').trim(),
    };
  }
}
