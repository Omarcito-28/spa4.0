import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET;
// Client ID de OAuth de Google (tipo "Aplicación web"). Vacío: el botón de Google no aparece.
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
