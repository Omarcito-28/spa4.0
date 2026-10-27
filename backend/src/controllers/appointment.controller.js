import BaseController from './base.controller.js';

export default class AppointmentController extends BaseController {
  static FAILURE_MESSAGES = {
    availability: 'No se pudo consultar la disponibilidad.',
    update: 'No se pudo actualizar la cita.',
    reschedule: 'No se pudo reprogramar la cita.',
    sendReminders: 'No se pudieron enviar los recordatorios.'
  };

  #appointments;
  #availability;
  #reminders;

  constructor(appointmentService, availabilityService, reminderService) {
    super();
    this.#appointments = appointmentService;
    this.#availability = availabilityService;
    this.#reminders = reminderService;
  }

  async policy(_req, res) {
    res.json(this.#appointments.getPolicy());
  }

  async sendReminders(_req, res) {
    res.json(await this.#reminders.sendDueReminders());
  }

  async list(req, res) {
    res.json(await this.#appointments.listFor(req.user));
  }

  async availability(req, res) {
    const { date, stylist } = req.query;
    res.json(await this.#availability.getAvailability(date, stylist));
  }

  async create(req, res) {
    res.status(201).json(await this.#appointments.create(req.user, req.body));
  }

  async reschedule(req, res) {
    res.json(await this.#appointments.reschedule(req.params.id, req.body, req.user));
  }

  async updateStatus(req, res) {
    res.json(await this.#appointments.updateStatus(req.params.id, req.body.status, req.user));
  }

  async update(req, res) {
    res.json(await this.#appointments.update(req.params.id, req.body, req.user));
  }

  async remove(req, res) {
    await this.#appointments.delete(req.params.id);
    res.json({ success: true, message: 'Cita eliminada permanentemente.' });
  }
}
