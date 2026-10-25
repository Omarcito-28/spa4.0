import connectDB from './db.js';
import { PORT } from './config.js';

import { createApp } from './src/app.js';
import { databaseSeeder } from './src/container.js';
import CorsPolicy from './src/middlewares/cors.policy.js';

// Conectar a MongoDB y luego iniciar el servidor
const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('Configura MONGODB_URI antes de iniciar el servidor.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe contener al menos 32 caracteres aleatorios.');
  }
  // En producción FRONTEND_URL define el origen permitido por CORS y los enlaces de los correos.
  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    throw new Error('Configura FRONTEND_URL con la URL pública del frontend (por ejemplo https://<proyecto>.vercel.app).');
  }
  await connectDB();
  await databaseSeeder.run();

  const corsPolicy = CorsPolicy.fromEnv();
  const app = createApp({ corsPolicy });
  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => resolve(server));
    server.once('error', reject);
  });
  console.log(`🚀 Servidor backend escuchando en el puerto ${PORT}`);
  console.log(corsPolicy.allowsAnyOrigin
    ? '⚠️ CORS acepta cualquier origen: define FRONTEND_URL para restringirlo.'
    : `🔒 CORS permitido para: ${corsPolicy.origins.join(', ')}`);
};

startServer().catch(error => {
  console.error(`❌ No se pudo iniciar el servidor: ${error.message}`);
  process.exitCode = 1;
});
