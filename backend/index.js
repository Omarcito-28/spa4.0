import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

import connectDB from './db.js';
import { PORT } from './config.js';

import authRoutes from './src/routes/auth.routes.js';
import servicesRoutes from './src/routes/services.routes.js';
import appointmentsRoutes from './src/routes/appointments.routes.js';
import usersRoutes from './src/routes/users.routes.js';

import User from './src/models/user.model.js';
import Service from './src/models/service.model.js';
import BookingLock from './src/models/booking-lock.model.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Seeding - Inicialización de datos en MongoDB
const initDatabase = async () => {
  const adminCount = await User.countDocuments({ role: 'ADMIN' });
  await BookingLock.updateOne(
    { _id: 'unassigned' },
    { $setOnInsert: { version: 0 } },
    { upsert: true }
  );
  const { BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME } = process.env;
  if (!adminCount && BOOTSTRAP_ADMIN_USERNAME && BOOTSTRAP_ADMIN_PASSWORD &&
      BOOTSTRAP_ADMIN_EMAIL && BOOTSTRAP_ADMIN_NAME) {
    await User.create({
      username: BOOTSTRAP_ADMIN_USERNAME.trim().toLowerCase(),
      password: await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12),
      email: BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase(),
      fullName: BOOTSTRAP_ADMIN_NAME.trim(),
      role: 'ADMIN'
    });
    console.log('✅ Administrador inicial creado desde variables de entorno.');
  } else if (!adminCount) {
    console.warn('⚠️ No hay administrador. Configura BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_NAME para crear uno.');
  }

  // 2. Servicios por defecto
  const servicesCount = await Service.countDocuments();
  if (servicesCount === 0) {
    await Service.insertMany([
      {
        name: 'Manicura Clásica',
        description: 'Servicio completo de manicura que incluye limado, pulido y esmaltado para unas manos perfectamente cuidadas y elegantes.',
        price: '$30.000',
        image: '/images/services/manicura_clasica.jpg'
      },
      {
        name: 'Tintura de Cabello',
        description: 'Coloración profesional con productos de alta calidad para un color vibrante, uniforme y de larga duración en tu cabello.',
        price: '$150.000',
        image: '/images/services/tintura.webp'
      },
      {
        name: 'Tratamiento Capilar',
        description: 'Tratamiento nutritivo e hidratante para restaurar la salud, brillo y suavidad de tu cabello dañado o reseco.',
        price: '$60.000',
        image: '/images/services/tratamiento_capilar.webp'
      },
      {
        name: 'Corte para Dama',
        description: 'Corte de cabello profesional para mujer, adaptado a tu tipo de rostro y estilo personal con acabado impecable.',
        price: '$35.000',
        image: '/images/services/corte_dama.jpg'
      },
      {
        name: 'Peinado para Evento',
        description: 'Peinados elegantes y creativos para bodas, graduaciones y eventos especiales que te harán lucir espectacular.',
        price: '$200.000',
        image: '/images/services/peinado_evento.jpg'
      },
      {
        name: 'Masaje Relajante',
        description: 'Masaje terap�utico para aliviar el estr�s, relajar tensiones musculares y renovar tu energ�a.',
        price: '$70.000',
        image: '/images/services/masaje.jpg'
      }
    ]);
    console.log('✅ Servicios iniciales creados.');
  }
};

// Conectar a MongoDB y luego iniciar el servidor
const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('Configura MONGODB_URI antes de iniciar el servidor.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe contener al menos 32 caracteres aleatorios.');
  }
  await connectDB();
  await initDatabase();

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  // Rutas
  app.use('/api/auth', authRoutes);
  app.use('/api/services', servicesRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/users', usersRoutes);

  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => resolve(server));
    server.once('error', reject);
  });
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
};

startServer().catch(error => {
  console.error(`❌ No se pudo iniciar el servidor: ${error.message}`);
  process.exitCode = 1;
});
