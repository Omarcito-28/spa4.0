import nodemailer from 'nodemailer';

const isConfigured = () => Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_FROM
);

const createTransport = () => {
  if (!isConfigured()) {
    throw new Error('Configura SMTP_HOST, SMTP_PORT y SMTP_FROM para habilitar el correo.');
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });
};

export const emailDeliveryConfigured = isConfigured;

export const sendEmail = async ({ to, subject, text }) => {
  const transport = createTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text
  });
};

export const sendEmailBestEffort = async message => {
  try {
    await sendEmail(message);
  } catch (error) {
    console.error(`No se pudo enviar correo a ${message.to}: ${error.message}`);
  }
};
