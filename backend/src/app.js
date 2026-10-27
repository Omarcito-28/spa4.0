import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import servicesRoutes from './routes/services.routes.js';
import serviceImagesRoutes from './routes/service-images.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import usersRoutes from './routes/users.routes.js';
import timeOffRoutes from './routes/time-off.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import clientNotesRoutes from './routes/client-notes.routes.js';

import { errorMiddleware } from './container.js';
import CorsPolicy from './middlewares/cors.policy.js';

// Arma la aplicación Express sin abrir puertos ni conectarse a la base,
// para que index.js y las pruebas de integración la usen por igual.
export const createApp = ({ corsPolicy = CorsPolicy.fromEnv() } = {}) => {
  const app = express();
  // En Render la API está detrás de un proxy: así req.ip es la IP real del cliente (límite de intentos de login).
  app.set('trust proxy', 1);

  // Middlewares globales
  app.use(cors(corsPolicy.toOptions()));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  // Rutas
  app.use('/api/auth', authRoutes);
  app.use('/api/services', servicesRoutes);
  app.use('/api/service-images', serviceImagesRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/time-off', timeOffRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/client-notes', clientNotesRoutes);

  // Debe registrarse después de las rutas para recibir sus errores.
  app.use(errorMiddleware.handle);
  return app;
};
