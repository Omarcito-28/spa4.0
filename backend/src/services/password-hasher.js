import bcrypt from 'bcryptjs';

export default class PasswordHasher {
  #rounds;

  constructor(rounds = 10) {
    this.#rounds = rounds;
  }

  hash(password, rounds = this.#rounds) {
    return bcrypt.hash(password, rounds);
  }

  compare(password, hash) {
    return bcrypt.compare(password, hash);
  }
}
