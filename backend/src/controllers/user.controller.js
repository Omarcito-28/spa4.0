import BaseController from './base.controller.js';

export default class UserController extends BaseController {
  static FAILURE_MESSAGES = {
    list: 'No se pudieron cargar los usuarios.',
    create: 'No se pudo crear el usuario.',
    listStylists: 'No se pudieron cargar los estilistas.',
    getSchedule: 'No se pudo cargar el horario.',
    updateSchedule: 'No se pudo guardar el horario.',
    update: 'No se pudo actualizar el usuario.',
    remove: 'No se pudo eliminar el usuario.'
  };

  #users;

  constructor(userService) {
    super();
    this.#users = userService;
  }

  async list(_req, res) {
    res.json(await this.#users.listAll());
  }

  async create(req, res) {
    res.status(201).json(await this.#users.create(req.body));
  }

  async listStylists(_req, res) {
    res.json(await this.#users.listStylists());
  }

  async getSchedule(req, res) {
    res.json(await this.#users.getSchedule(req.user.id));
  }

  async updateSchedule(req, res) {
    res.json(await this.#users.updateSchedule(req.user.id, req.body.weeklySchedule));
  }

  async update(req, res) {
    res.json(await this.#users.update(req.params.id, req.body, req.user));
  }

  async remove(req, res) {
    await this.#users.delete(req.params.id, req.user);
    res.json({ success: true, message: 'Usuario eliminado.' });
  }
}
