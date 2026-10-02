import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../src/models/service.model.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB');

await Service.deleteMany({});
console.log('🗑️ Servicios eliminados');

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

console.log('✅ Servicios actualizados correctamente');
await mongoose.disconnect();
process.exit(0);
