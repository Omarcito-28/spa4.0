// Datos de prueba para recorrer todas las funcionalidades de la página:
// usuarios de cada rol, horarios de estilistas, servicios activos y ocultos,
// citas en todos los estados (pasadas, de hoy, de mañana y futuras), reseñas,
// notas internas de clientes, días libres y un cierre del spa.
//
// Uso:  node scripts/seedTestData.js --yes
//
// Es repetible: cada ejecución borra primero solo lo que creó la anterior
// (usuarios con correo @prueba.essencedetoi.com y todo lo asociado a ellos).
// No toca el administrador real ni los datos de clientes reales.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.model.js';
import Service from '../src/models/service.model.js';
import Appointment from '../src/models/appointment.model.js';
import Review from '../src/models/review.model.js';
import ClientNote from '../src/models/client-note.model.js';
import TimeOff from '../src/models/time-off.model.js';
import DatabaseSeeder from '../src/database/database-seeder.js';
import ReviewService from '../src/services/review.service.js';
import AppointmentTime from '../src/utils/appointment-time.js';
import BogotaClock from '../src/utils/bogota-clock.js';

dotenv.config();

const PASSWORD = 'Prueba123*';
const EMAIL_DOMAIN = 'prueba.essencedetoi.com';
const email = username => `${username}@${EMAIL_DOMAIN}`;

if (!process.argv.includes('--yes')) {
  console.error('Este script escribe en la base de datos configurada en MONGODB_URI.');
  console.error('Ejecútalo con --yes para confirmar:  node scripts/seedTestData.js --yes');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production') {
  console.error('❌ NODE_ENV=production: no se cargan datos de prueba en producción.');
  process.exit(1);
}

// Lunes a viernes 9:00-18:00 / martes a sábado 10:00-19:00.
const week = (days, start, end) => [0, 1, 2, 3, 4, 5, 6].map(day => ({ day, enabled: days.includes(day), start, end }));

const USERS = [
  { username: 'admin_prueba', fullName: 'Admin de Prueba', role: 'ADMIN', phoneNumber: '3000000000' },
  { username: 'laura_estilista', fullName: 'Laura Restrepo', role: 'STYLIST', phoneNumber: '3101112233', weeklySchedule: week([1, 2, 3, 4, 5], '09:00', '18:00') },
  { username: 'camila_estilista', fullName: 'Camila Ortiz', role: 'STYLIST', phoneNumber: '3104445566', weeklySchedule: week([2, 3, 4, 5, 6], '10:00', '19:00') },
  // Sin horario propio: usa la jornada general del spa.
  { username: 'sofia_estilista', fullName: 'Sofía Herrera', role: 'STYLIST', phoneNumber: '3107778899' },
  // Desactivada: no aparece para reservar, pero conserva sus citas antiguas.
  { username: 'paula_inactiva', fullName: 'Paula Gómez', role: 'STYLIST', isActive: false },
  { username: 'ana_cliente', fullName: 'Ana María Pérez', role: 'CLIENT', phoneNumber: '3201234567' },
  { username: 'juan_cliente', fullName: 'Juan David Rodríguez', role: 'CLIENT', phoneNumber: '3207654321' },
  { username: 'valentina_cliente', fullName: 'Valentina Castro', role: 'CLIENT', phoneNumber: '3151239876' },
  { username: 'carlos_cliente', fullName: 'Carlos Andrés Muñoz', role: 'CLIENT' },
  { username: 'mariana_cliente', fullName: 'Mariana López', role: 'CLIENT', phoneNumber: '3009876543' },
  { username: 'daniel_cliente', fullName: 'Daniel Torres', role: 'CLIENT', phoneNumber: '3112223344' },
  { username: 'isabella_cliente', fullName: 'Isabella Vargas', role: 'CLIENT', phoneNumber: '3165554433' },
  { username: 'cliente_inactivo', fullName: 'Pedro Ramírez', role: 'CLIENT', isActive: false }
];
// Clientes extra para probar la paginación de usuarios (más de una página).
for (let index = 1; index <= 12; index++) {
  USERS.push({ username: `cliente${String(index).padStart(2, '0')}`, fullName: `Cliente Prueba ${index}`, role: 'CLIENT' });
}

const EXTRA_SERVICES = [
  { name: 'Pedicura Spa', description: 'Pedicura completa con exfoliación, hidratación profunda y esmaltado de larga duración.', price: '$45.000', duration: 75, image: '/images/services/manicura_clasica.jpg' },
  { name: 'Limpieza Facial Profunda', description: 'Limpieza con extracción, mascarilla purificante e hidratación según tu tipo de piel.', price: '$90.000', duration: 90, image: '/images/services/masaje.jpg' },
  // Oculto: sirve para probar que no aparece en el catálogo público ni para reservar.
  { name: 'Alisado de Keratina (oculto)', description: 'Servicio temporalmente fuera del catálogo.', price: '$250.000', duration: 180, image: '/images/services/tratamiento_capilar.webp', isActive: false }
];
const DURATIONS = {
  'Manicura Clásica': 45, 'Tintura de Cabello': 120, 'Tratamiento Capilar': 60,
  'Corte para Dama': 45, 'Peinado para Evento': 90, 'Masaje Relajante': 60
};

const clock = new BogotaClock();
const today = clock.today();
const testUsernames = USERS.map(user => user.username);

await mongoose.connect(process.env.MONGODB_URI);
console.log(`✅ Conectado a MongoDB (${mongoose.connection.host}/${mongoose.connection.name})`);

// 1. Limpieza de la ejecución anterior.
const previous = await User.find({ email: { $regex: `@${EMAIL_DOMAIN.replace(/\./g, '\\.')}$` } }).select('username');
const previousUsernames = [...new Set([...previous.map(user => user.username), ...testUsernames])];
const previousAppointments = await Appointment.find({
  $or: [{ username: { $in: previousUsernames } }, { stylist: { $in: previousUsernames } }]
}).select('_id');
await Review.deleteMany({ $or: [{ appointment: { $in: previousAppointments.map(item => item._id) } }, { username: { $in: previousUsernames } }] });
await Appointment.deleteMany({ _id: { $in: previousAppointments.map(item => item._id) } });
await ClientNote.deleteMany({ $or: [{ client: { $in: previousUsernames } }, { author: { $in: previousUsernames } }] });
await TimeOff.deleteMany({ createdBy: { $in: previousUsernames } });
await User.deleteMany({ username: { $in: previousUsernames } });
await Service.deleteMany({ name: { $in: EXTRA_SERVICES.map(service => service.name) } });
console.log('🗑️ Datos de prueba anteriores eliminados');

// 2. Servicios: el catálogo base (si falta) con duraciones variadas y los extra.
for (const service of DatabaseSeeder.DEFAULT_SERVICES) {
  await Service.updateOne(
    { name: service.name },
    { $setOnInsert: { ...service, duration: DURATIONS[service.name] ?? 60, isActive: true } },
    { upsert: true }
  );
}
await Service.insertMany(EXTRA_SERVICES);
const services = await Service.find({ isActive: true });
const priceOf = name => services.find(service => service.name === name)?.price ?? '';
const durationOf = name => services.find(service => service.name === name)?.duration ?? 60;

// 3. Usuarios.
const hash = await bcrypt.hash(PASSWORD, 10);
await User.insertMany(USERS.map(user => ({ isActive: true, weeklySchedule: [], ...user, email: email(user.username), password: hash })));
console.log(`👤 ${USERS.length} usuarios creados`);

// 4. Días libres y cierres (a partir de dos semanas, para no bloquear las citas cercanas).
const offset = days => AppointmentTime.addDays(today, days);
const timeOff = [
  { stylist: 'laura_estilista', start: offset(14), end: offset(16), reason: 'Vacaciones', createdBy: 'admin_prueba' },
  { stylist: 'camila_estilista', start: offset(9), end: offset(9), reason: 'Cita médica', createdBy: 'admin_prueba' },
  { stylist: '', start: offset(21), end: offset(21), reason: 'Festivo: spa cerrado', createdBy: 'admin_prueba' },
  { stylist: 'sofia_estilista', start: offset(-10), end: offset(-8), reason: 'Capacitación (pasada)', createdBy: 'admin_prueba' }
];
await TimeOff.insertMany(timeOff);

// 5. Citas. Cada una se ajusta al primer día en que su estilista trabaja y no
// tiene día libre, y a la primera hora sin cruces, para que todo sea coherente.
const stylistUsers = await User.find({ role: 'STYLIST', username: { $in: testUsernames } });
const workday = (stylist, date) => {
  const weekday = AppointmentTime.weekday(date);
  const user = stylistUsers.find(item => item.username === stylist);
  if (!user || !user.weeklySchedule.length) {
    return weekday === 0 ? null : { start: '09:00', end: weekday === 6 ? '17:00' : '19:00' };
  }
  const day = user.weeklySchedule.find(item => item.day === weekday);
  return day?.enabled ? day : null;
};
const blocked = (stylist, date) => timeOff.some(block =>
  (!block.stylist || block.stylist === stylist) && block.start <= date && date <= block.end);
const toTime = minutes => {
  const hour = Math.floor(minutes / 60);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

const planned = [];
const place = ({ day, hour, stylist = '', service, ...rest }) => {
  const duration = durationOf(service);
  const past = day < 0;
  for (let shift = 0; shift < 14; shift++) {
    const date = offset(past ? day - shift : day + shift);
    const schedule = workday(stylist, date);
    if (!schedule || blocked(stylist, date)) continue;
    const open = AppointmentTime.clockToMinutes(schedule.start);
    const close = AppointmentTime.clockToMinutes(schedule.end);
    // Hoy solo se usan horas que aún no han pasado (salvo las citas "de hoy ya atendidas").
    const earliest = date === today && !rest.allowPastToday ? Math.max(open, clock.minutesNow() + 60) : open;
    for (let start = Math.max(earliest, hour * 60); start + duration <= close; start += 30) {
      const clash = planned.some(item => item.date === date && item.stylist === stylist &&
        start < item.start + item.duration && item.start < start + duration);
      if (clash) continue;
      planned.push({ date, start, duration, stylist });
      const { allowPastToday: _ignored, ...fields } = rest;
      return { ...fields, service, stylist, date, time: toTime(start), duration, price: priceOf(service) };
    }
  }
  return null;
};

const plan = [
  // Historial: completadas (con y sin reseña), canceladas e inasistencias.
  { day: -60, hour: 10, username: 'ana_cliente', service: 'Tintura de Cabello', stylist: 'laura_estilista', status: 'COMPLETED', notes: 'Tono castaño claro 7.1', review: { rating: 5, comment: 'Quedé feliz con el color, Laura es muy profesional.' } },
  { day: -45, hour: 11, username: 'ana_cliente', service: 'Manicura Clásica', stylist: 'camila_estilista', status: 'COMPLETED', review: { rating: 4, comment: 'Muy bonito el acabado, aunque esperé unos minutos.' } },
  { day: -30, hour: 9, username: 'juan_cliente', service: 'Masaje Relajante', stylist: 'sofia_estilista', status: 'COMPLETED', review: { rating: 5, comment: '' } },
  { day: -28, hour: 15, username: 'valentina_cliente', service: 'Peinado para Evento', stylist: 'camila_estilista', status: 'COMPLETED', notes: 'Grado de la universidad', review: { rating: 3, comment: 'El peinado estuvo bien pero no duró toda la noche.' } },
  { day: -20, hour: 14, username: 'mariana_cliente', service: 'Limpieza Facial Profunda', stylist: 'sofia_estilista', status: 'COMPLETED', review: { rating: 5, comment: 'Mi piel quedó increíble. ¡Volveré!' } },
  { day: -15, hour: 10, username: 'daniel_cliente', service: 'Corte para Dama', stylist: 'laura_estilista', status: 'COMPLETED', review: { rating: 2, comment: 'No era el corte que pedí.' } },
  // Completadas sin reseña: el cliente puede calificarlas desde su panel.
  { day: -7, hour: 16, username: 'ana_cliente', service: 'Tratamiento Capilar', stylist: 'laura_estilista', status: 'COMPLETED' },
  { day: -5, hour: 11, username: 'juan_cliente', service: 'Pedicura Spa', stylist: 'camila_estilista', status: 'COMPLETED' },
  { day: -12, hour: 13, username: 'isabella_cliente', service: 'Masaje Relajante', stylist: 'sofia_estilista', status: 'NO_SHOW' },
  { day: -3, hour: 9, username: 'carlos_cliente', service: 'Corte para Dama', stylist: 'laura_estilista', status: 'NO_SHOW', notes: 'No contestó el teléfono' },
  { day: -10, hour: 15, username: 'valentina_cliente', service: 'Manicura Clásica', status: 'CANCELLED', notes: 'Canceló por viaje' },
  { day: -2, hour: 12, username: 'mariana_cliente', service: 'Tintura de Cabello', stylist: 'camila_estilista', status: 'CANCELLED' },
  // Cita antigua de una estilista ya desactivada.
  { day: -90, hour: 10, username: 'daniel_cliente', service: 'Masaje Relajante', stylist: 'paula_inactiva', status: 'COMPLETED', review: { rating: 4, comment: 'Buen masaje.' } },
  // Hoy: una ya atendida temprano y otras más tarde.
  { day: 0, hour: 9, username: 'isabella_cliente', service: 'Manicura Clásica', stylist: 'sofia_estilista', status: 'COMPLETED', allowPastToday: true },
  { day: 0, hour: 10, username: 'juan_cliente', service: 'Corte para Dama', stylist: 'sofia_estilista', status: 'CONFIRMED' },
  { day: 0, hour: 12, username: 'mariana_cliente', service: 'Pedicura Spa', status: 'PENDING', notes: 'Primera vez en el spa' },
  // Mañana: sin recordatorio enviado todavía (para probar los recordatorios).
  { day: 1, hour: 9, username: 'ana_cliente', service: 'Corte para Dama', stylist: 'laura_estilista', status: 'CONFIRMED', notes: 'Solo despuntar' },
  { day: 1, hour: 11, username: 'valentina_cliente', service: 'Masaje Relajante', stylist: 'sofia_estilista', status: 'CONFIRMED' },
  { day: 1, hour: 14, username: 'carlos_cliente', service: 'Tratamiento Capilar', status: 'PENDING' },
  // Próximas: pendientes por confirmar, sin estilista, confirmadas.
  { day: 2, hour: 10, username: 'daniel_cliente', service: 'Limpieza Facial Profunda', stylist: 'camila_estilista', status: 'PENDING' },
  { day: 3, hour: 15, username: 'isabella_cliente', service: 'Peinado para Evento', status: 'PENDING', notes: 'Boda el sábado, quiere un recogido bajo con flores naturales. Trae foto de referencia. Tiene el cabello largo y muy grueso, por favor reservar tiempo extra.' },
  // Nota larga sin espacios: comprueba que la tabla no se desborde.
  { day: 4, hour: 9, username: 'juan_cliente', service: 'Tintura de Cabello', stylist: 'laura_estilista', status: 'CONFIRMED', notes: 'Referencia:https://www.instagram.com/p/EjemploDeEnlaceMuyLargoQueNoTieneEspacios1234567890' },
  { day: 5, hour: 11, username: 'mariana_cliente', service: 'Manicura Clásica', stylist: 'camila_estilista', status: 'CONFIRMED' },
  { day: 6, hour: 13, username: 'ana_cliente', service: 'Pedicura Spa', stylist: 'sofia_estilista', status: 'PENDING' },
  { day: 8, hour: 10, username: 'valentina_cliente', service: 'Tintura de Cabello', stylist: 'camila_estilista', status: 'CONFIRMED', notes: 'Mechas balayage' },
  { day: 10, hour: 16, username: 'carlos_cliente', service: 'Masaje Relajante', stylist: 'laura_estilista', status: 'CONFIRMED' },
  { day: 12, hour: 9, username: 'daniel_cliente', service: 'Corte para Dama', status: 'PENDING' },
  { day: 18, hour: 14, username: 'isabella_cliente', service: 'Tratamiento Capilar', stylist: 'sofia_estilista', status: 'CANCELLED', notes: 'Canceló, reprogramará' },
  { day: 25, hour: 10, username: 'juan_cliente', service: 'Limpieza Facial Profunda', stylist: 'camila_estilista', status: 'CONFIRMED' }
];
// Varias citas de los clientes extra para llenar más de una página de la tabla.
for (let index = 1; index <= 12; index++) {
  plan.push({
    day: (index % 2 ? 1 : -1) * (index + 2),
    hour: 9 + (index % 8),
    username: `cliente${String(index).padStart(2, '0')}`,
    service: services[index % services.length].name,
    stylist: ['laura_estilista', 'camila_estilista', 'sofia_estilista', ''][index % 4],
    status: index % 2 ? (index % 3 ? 'CONFIRMED' : 'PENDING') : (index % 3 ? 'COMPLETED' : 'CANCELLED')
  });
}

let reviews = 0;
let appointments = 0;
const fullNameOf = username => USERS.find(user => user.username === username)?.fullName;
for (const { review, ...entry } of plan) {
  const data = place(entry);
  if (!data) {
    console.warn(`⚠️ Sin horario libre para la cita de ${entry.username} (${entry.service}); se omite.`);
    continue;
  }
  const appointment = await Appointment.create({ notes: '', ...data });
  appointments++;
  if (review && appointment.status === 'COMPLETED') {
    await Review.create({
      appointment: appointment._id,
      username: appointment.username,
      authorName: ReviewService.shortName(fullNameOf(appointment.username)),
      service: appointment.service,
      stylist: appointment.stylist,
      ...review
    });
    reviews++;
  }
}

// 6. Notas internas del equipo sobre clientes.
const notes = [
  { client: 'ana_cliente', author: 'laura_estilista', text: 'Usa tinte Igora 7.1 con oxidante de 20 vol. Cuero cabelludo sensible.' },
  { client: 'ana_cliente', author: 'admin_prueba', text: 'Cliente frecuente: ofrecer descuento de fidelidad en la próxima visita.' },
  { client: 'juan_cliente', author: 'sofia_estilista', text: 'Prefiere presión media en el masaje y música suave.' },
  { client: 'isabella_cliente', author: 'admin_prueba', text: 'Alergia al látex. No usar guantes de látex.' },
  { client: 'carlos_cliente', author: 'admin_prueba', text: 'Faltó a una cita sin avisar. Confirmar por teléfono antes de la próxima.' },
  { client: 'valentina_cliente', author: 'camila_estilista', text: 'Le gustan los peinados con trenzas; traer accesorios dorados.' }
];
await ClientNote.insertMany(notes.map(note => ({ ...note, authorName: fullNameOf(note.author) })));

console.log(`📅 ${appointments} citas, ⭐ ${reviews} reseñas, 📝 ${notes.length} notas, 🌴 ${timeOff.length} días libres/cierres`);
console.log(`🛎️ ${EXTRA_SERVICES.length} servicios de prueba (uno oculto)`);
console.log('\nCuentas de prueba (contraseña para todas: ' + PASSWORD + '):');
for (const role of ['ADMIN', 'STYLIST', 'CLIENT']) {
  const names = USERS.filter(user => user.role === role && !/^cliente\d/.test(user.username))
    .map(user => user.username + (user.isActive === false ? ' (inactivo)' : ''));
  console.log(`  ${role.padEnd(8)} ${names.join(', ')}`);
}
await mongoose.disconnect();
process.exit(0);
