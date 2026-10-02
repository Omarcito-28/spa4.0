import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import connectDB from './db.js';
import { PORT } from './config.js';

import authRoutes from './src/routes/auth.routes.js';
import servicesRoutes from './src/routes/services.routes.js';
import appointmentsRoutes from './src/routes/appointments.routes.js';
import usersRoutes from './src/routes/users.routes.js';

import User from './src/models/user.model.js';
import Service from './src/models/service.model.js';
import Appointment from './src/models/appointment.model.js';

dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Seeding - Inicialización de datos en MongoDB
const initDatabase = async () => {
  // 1. Usuarios por defecto
  const usersCount = await User.countDocuments();
  if (usersCount === 0) {
    await User.insertMany([
      {
        username: 'admin',
        password: bcrypt.hashSync('admin123', 10),
        fullName: 'Administrador',
        email: 'admin@essencedetoi.com',
        role: 'ADMIN'
      },
      {
        username: 'tuki',
        password: bcrypt.hashSync('tuki123', 10),
        fullName: 'Tuki Gonzales',
        email: 'tuki@essencedetoi.com',
        role: 'CLIENT'
      },
      {
        username: 'estilista',
        password: bcrypt.hashSync('estilista123', 10),
        fullName: 'Estilista Demo',
        email: 'estilista@essencedetoi.com',
        role: 'STYLIST'
      }
    ]);
    console.log('✅ Usuarios iniciales creados.');
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
        name: 'Pedicure Completo',
        description: 'Tratamiento completo de pedicure con exfoliación, hidratación y esmaltado para unos pies suaves y perfectos.',
        price: '$70.000',
        image: '/images/services/pedicure.jpg'
      }
    ]);
    console.log('✅ Servicios iniciales creados.');
  }

  // 3. Citas por defecto
  const appointmentsCount = await Appointment.countDocuments();
  if (appointmentsCount === 0) {
    await Appointment.insertMany([
      {
        username: 'tuki',
        service: 'Maquillaje de Novia & Gala',
        date: '2026-06-17',
        time: '11:00 AM',
        notes: 'Boda civil por la tarde',
        status: 'CONFIRMED'
      },
      {
        username: 'tuki',
        service: 'Perfilado y Diseño de Cejas',
        date: '2026-06-14',
        time: '05:00 PM',
        notes: 'Primera vez',
        status: 'CANCELLED'
      }
    ]);
    console.log('✅ Citas iniciales creadas.');
  }
};

// Conectar a MongoDB y luego iniciar el servidor
const startServer = async () => {
  await connectDB();
  await initDatabase();

  // Rutas
  app.use('/api/auth', authRoutes);
  app.use('/api/services', servicesRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/users', usersRoutes);

  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  });
};

startServer();
