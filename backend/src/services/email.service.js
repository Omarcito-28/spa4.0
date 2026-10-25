import nodemailer from 'nodemailer';

export default class EmailService {
  #env;

  constructor(env = process.env) {
    this.#env = env;
  }

  isConfigured() {
    const env = this.#env;
    return Boolean(
      env.SMTP_HOST &&
      env.SMTP_PORT &&
      env.SMTP_FROM &&
      (!env.SMTP_USER || env.SMTP_PASSWORD)
    );
  }

  async send({ to, subject, text }) {
    const transport = this.#createTransport();
    await transport.sendMail({
      from: this.#env.SMTP_FROM,
      to,
      subject,
      text
    });
  }

  async sendBestEffort(message) {
    try {
      await this.send(message);
    } catch (error) {
      console.error(`No se pudo enviar correo a ${message.to}: ${error.message}`);
    }
  }

  #createTransport() {
    if (!this.isConfigured()) {
      throw new Error('Configura SMTP_HOST, SMTP_PORT y SMTP_FROM; si usas autenticación, también SMTP_USER y SMTP_PASSWORD.');
    }
    const env = this.#env;
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: env.SMTP_SECURE === 'true',
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined
    });
  }
}
