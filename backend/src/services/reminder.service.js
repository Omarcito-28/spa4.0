import AppointmentTime from '../utils/appointment-time.js';

// Envía por correo un recordatorio el día anterior a cada cita activa. Cada cita se
// marca antes de enviar, así dos procesos no mandan el mismo recordatorio dos veces.
export default class ReminderService {
  static INTERVAL_MS = 30 * 60 * 1000;

  #appointments;
  #users;
  #email;
  #clock;
  #timer = null;

  constructor({ appointmentModel, userModel, emailService, clock }) {
    this.#appointments = appointmentModel;
    this.#users = userModel;
    this.#email = emailService;
    this.#clock = clock;
  }

  // Devuelve cuántos recordatorios se enviaron. Sin SMTP configurado no hace nada.
  async sendDueReminders() {
    if (!this.#email.isConfigured()) return { sent: 0, skipped: 'Correo no configurado.' };
    const tomorrow = AppointmentTime.addDays(this.#clock.today(), 1);
    const due = await this.#appointments.find({
      date: tomorrow,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      reminderSentAt: null
    }).select('_id');

    let sent = 0;
    for (const { _id } of due) {
      const appointment = await this.#appointments.findOneAndUpdate(
        { _id, reminderSentAt: null, status: { $in: ['PENDING', 'CONFIRMED'] } },
        { reminderSentAt: new Date() },
        { new: true }
      );
      if (!appointment) continue;
      try {
        await this.#send(appointment);
        sent += 1;
      } catch (error) {
        // Se libera la marca para reintentar en la siguiente ronda.
        await this.#appointments.updateOne({ _id }, { reminderSentAt: null });
        console.error(`No se pudo enviar el recordatorio de la cita ${_id}: ${error.message}`);
      }
    }
    return { sent };
  }

  start(intervalMs = ReminderService.INTERVAL_MS) {
    if (this.#timer) return;
    const run = () => this.sendDueReminders().catch(error =>
      console.error(`Falló la ronda de recordatorios: ${error.message}`));
    run();
    this.#timer = setInterval(run, intervalMs);
    // No impide que el proceso termine (por ejemplo en un apagado ordenado).
    this.#timer.unref?.();
  }

  stop() {
    clearInterval(this.#timer);
    this.#timer = null;
  }

  async #send(appointment) {
    const customer = await this.#users.findOne({ username: appointment.username }).select('email fullName');
    if (!customer?.email) throw new Error('el cliente no tiene correo');
    const stylist = appointment.stylist
      ? (await this.#users.findOne({ username: appointment.stylist }).select('fullName'))?.fullName || appointment.stylist
      : 'Por asignar';
    const pendingNote = appointment.status === 'PENDING'
      ? '\nTu cita todavía está pendiente de confirmación por parte del equipo.\n'
      : '';
    await this.#email.send({
      to: customer.email,
      subject: 'Recordatorio: tu cita es mañana - Essence De Toi',
      text: `Hola ${customer.fullName || ''}, te recordamos tu cita de mañana:\n\n` +
        `Servicio: ${appointment.service}\nFecha: ${appointment.date}\nHora: ${appointment.time}\nEstilista: ${stylist}\n` +
        `${pendingNote}\nSi no puedes asistir, cancélala o reprográmala desde «Mis citas» para liberar el horario.`
    });
  }
}
