// Raíz de composición: único lugar donde se crean las instancias y se
// inyectan sus dependencias. El resto del código solo recibe abstracciones.
import { JWT_SECRET } from '../config.js';

import User from './models/user.model.js';
import Service from './models/service.model.js';
import ServiceImage from './models/service-image.model.js';
import Appointment from './models/appointment.model.js';
import BookingLock from './models/booking-lock.model.js';
import TimeOff from './models/time-off.model.js';
import Review from './models/review.model.js';
import ClientNote from './models/client-note.model.js';

import EmailService from './services/email.service.js';
import TokenService from './services/token.service.js';
import PasswordHasher from './services/password-hasher.js';
import BookingLockService from './services/booking-lock.service.js';
import AvailabilityService from './services/availability.service.js';
import AppointmentService from './services/appointment.service.js';
import AuthService from './services/auth.service.js';
import UserService from './services/user.service.js';
import ServiceCatalogService from './services/service-catalog.service.js';
import ServiceImageService from './services/service-image.service.js';
import TimeOffService from './services/time-off.service.js';
import ReminderService from './services/reminder.service.js';
import ReviewService from './services/review.service.js';
import ClientNoteService from './services/client-note.service.js';
import BogotaClock from './utils/bogota-clock.js';

import AuthController from './controllers/auth.controller.js';
import UserController from './controllers/user.controller.js';
import ServiceController from './controllers/service.controller.js';
import ServiceImageController from './controllers/service-image.controller.js';
import AppointmentController from './controllers/appointment.controller.js';
import TimeOffController from './controllers/time-off.controller.js';
import ReviewController from './controllers/review.controller.js';
import ClientNoteController from './controllers/client-note.controller.js';

import AuthMiddleware from './middlewares/auth.middleware.js';
import ErrorMiddleware from './middlewares/error.middleware.js';
import LoginRateLimiter from './middlewares/login-rate-limiter.js';
import DatabaseSeeder from './database/database-seeder.js';

const emailService = new EmailService(process.env);
const tokenService = new TokenService(JWT_SECRET);
const passwordHasher = new PasswordHasher();
const bookingLockService = new BookingLockService({ userModel: User, bookingLockModel: BookingLock });

const clock = new BogotaClock();
const timeOffService = new TimeOffService({
  timeOffModel: TimeOff,
  userModel: User,
  appointmentModel: Appointment,
  bookingLockService,
  clock
});
const availabilityService = new AvailabilityService({ userModel: User, appointmentModel: Appointment, timeOffService });
// Horas mínimas para que el cliente cancele o reprograme por su cuenta; 0 desactiva la regla.
const cancellationNoticeHours = Number.parseInt(process.env.CANCELLATION_NOTICE_HOURS ?? '24', 10);
const appointmentService = new AppointmentService({
  appointmentModel: Appointment,
  serviceModel: Service,
  userModel: User,
  availabilityService,
  bookingLockService,
  emailService,
  clock,
  cancellationNoticeHours: Number.isNaN(cancellationNoticeHours) ? 24 : Math.max(0, cancellationNoticeHours)
});
const authService = new AuthService({ userModel: User, passwordHasher, tokenService, emailService });
const userService = new UserService({ userModel: User, appointmentModel: Appointment, passwordHasher, clock });
const serviceCatalogService = new ServiceCatalogService({ serviceModel: Service, appointmentModel: Appointment, clock });
const serviceImageService = new ServiceImageService({ serviceImageModel: ServiceImage });
const reviewService = new ReviewService({ reviewModel: Review, appointmentModel: Appointment, userModel: User });
const clientNoteService = new ClientNoteService({ clientNoteModel: ClientNote, userModel: User, appointmentModel: Appointment });

export const reminderService = new ReminderService({ appointmentModel: Appointment, userModel: User, emailService, clock });

export const authMiddleware = new AuthMiddleware({ userModel: User, tokenService });
export const errorMiddleware = new ErrorMiddleware();
export const loginRateLimiter = new LoginRateLimiter();

export const authController = new AuthController(authService);
export const userController = new UserController(userService);
export const serviceController = new ServiceController(serviceCatalogService);
export const serviceImageController = new ServiceImageController(serviceImageService);
export const appointmentController = new AppointmentController(appointmentService, availabilityService, reminderService);
export const timeOffController = new TimeOffController(timeOffService);
export const reviewController = new ReviewController(reviewService);
export const clientNoteController = new ClientNoteController(clientNoteService);

export const databaseSeeder = new DatabaseSeeder({
  userModel: User,
  serviceModel: Service,
  bookingLockService,
  passwordHasher
});
