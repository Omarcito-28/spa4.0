import { inject } from 'vitest';

// Se ejecuta antes de importar cada archivo de pruebas. config.js llama a
// dotenv, que nunca sobrescribe variables ya definidas: así backend/.env (y su
// URI de Atlas) no llega a las pruebas.
process.env.MONGODB_URI = inject('mongoUri');
process.env.JWT_SECRET = 'test-secret-que-tiene-mas-de-32-caracteres';
process.env.PORT = '0';
process.env.FRONTEND_URL = 'http://localhost:5173';
for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM']) {
  process.env[key] = '';
}
for (const key of ['BOOTSTRAP_ADMIN_USERNAME', 'BOOTSTRAP_ADMIN_PASSWORD', 'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_NAME']) {
  process.env[key] = '';
}
