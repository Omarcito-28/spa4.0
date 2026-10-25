import BaseController from './base.controller.js';

export default class AuthController extends BaseController {
  static FAILURE_MESSAGES = {
    resetPassword: 'No se pudo restablecer la contraseña.'
  };

  #auth;

  constructor(authService) {
    super();
    this.#auth = authService;
  }

  async register(req, res) {
    res.status(201).json(await this.#auth.register(req.body));
  }

  async login(req, res) {
    res.json(await this.#auth.login(req.body));
  }

  async getProfile(req, res) {
    res.json(await this.#auth.getProfile(req.user));
  }

  async updateProfile(req, res) {
    res.json(await this.#auth.updateProfile(req.user, req.body));
  }

  async requestPasswordReset(req, res) {
    const message = await this.#auth.requestPasswordReset(req.body.email);
    res.status(202).json({ message });
  }

  async resetPassword(req, res) {
    const message = await this.#auth.resetPassword(req.body);
    res.json({ message });
  }
}
