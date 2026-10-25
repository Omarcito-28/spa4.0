import jwt from 'jsonwebtoken';

export default class TokenService {
  #secret;
  #expiresIn;

  constructor(secret, expiresIn = '24h') {
    this.#secret = secret;
    this.#expiresIn = expiresIn;
  }

  sign(user) {
    return jwt.sign(
      { id: user._id, username: user.username, role: user.role, email: user.email, fullName: user.fullName, tokenVersion: user.tokenVersion },
      this.#secret,
      { expiresIn: this.#expiresIn }
    );
  }

  verify(token) {
    return jwt.verify(token, this.#secret);
  }
}
