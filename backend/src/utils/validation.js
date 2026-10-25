import { ValidationError } from '../errors/index.js';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reglas comunes para crear una cuenta, tanto en el registro público como desde el panel de administrador.
export function assertNewAccountFields({ username, password, fullName, email }) {
  if (typeof username !== 'string' || typeof fullName !== 'string' || typeof email !== 'string' ||
      typeof password !== 'string' || !username.trim() || !password || !fullName.trim() || !email.trim()) {
    throw new ValidationError('Todos los campos son obligatorios.');
  }
  if (password.length < 8) {
    throw new ValidationError('La contraseña debe tener al menos 8 caracteres.');
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    throw new ValidationError('El correo electrónico no es válido.');
  }
}
