// Raíz de composición: único lugar donde se crean las instancias y se
// inyectan sus dependencias. El resto del código solo recibe abstracciones.
import { JWT_SECRET } from '../config.js';

import User from './models/user.model.js';
import Service from './models/service.model.js';
import Appointment from './models/appointment.model.js';
import BookingLock from './models/booking-lock.model.js';

import EmailService from './services/email.service.js';
import TokenService from './services/token.service.js';
import PasswordHasher from './services/password-hasher.js';
import BookingLockService from './services/booking-lock.service.js';
import AvailabilityService from './services/availability.service.js';
import AppointmentService from './services/appointment.service.js';
import AuthService from './services/auth.service.js';
import UserService from './services/user.service.js';
import ServiceCatalogService from './services/service-catalog.service.js';
import BogotaClock from './utils/bogota-clock.js';

import AuthController from './controllers/auth.controller.js';
import UserController from './controllers/user.controller.js';
import ServiceController from './controllers/service.controller.js';
import AppointmentController from './controllers/appointment.controller.js';

import AuthMiddleware from './middlewares/auth.middleware.js';
import ErrorMiddleware from './middlewares/error.middleware.js';
import DatabaseSeeder from './database/database-seeder.js';

const emailService = new EmailService(process.env);
const tokenService = new TokenService(JWT_SECRET);
const passwordHasher = new PasswordHasher();
const bookingLockService = new BookingLockService({ userModel: User, bookingLockModel: BookingLock });

const availabilityService = new AvailabilityService({ userModel: User, appointmentModel: Appointment });
const appointmentService = new AppointmentService({
  appointmentModel: Appointment,
  serviceModel: Service,
  userModel: User,
  availabilityService,
  bookingLockService,
  emailService,
  clock: new BogotaClock()
});
const authService = new AuthService({ userModel: User, passwordHasher, tokenService, emailService });
const userService = new UserService({ userModel: User, appointmentModel: Appointment, passwordHasher });
const serviceCatalogService = new ServiceCatalogService({ serviceModel: Service });

export const authMiddleware = new AuthMiddleware({ userModel: User, tokenService });
export const errorMiddleware = new ErrorMiddleware();

export const authController = new AuthController(authService);
export const userController = new UserController(userService);
export const serviceController = new ServiceController(serviceCatalogService);
export const appointmentController = new AppointmentController(appointmentService, availabilityService);

export const databaseSeeder = new DatabaseSeeder({
  userModel: User,
  serviceModel: Service,
  bookingLockService,
  passwordHasher
});
