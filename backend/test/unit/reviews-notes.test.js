// Reseñas de clientes y notas internas sobre clientes, con los modelos reales
// sobre el MongoDB en memoria.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import User from '../../src/models/user.model.js';
import Appointment from '../../src/models/appointment.model.js';
import Review from '../../src/models/review.model.js';
import ClientNote from '../../src/models/client-note.model.js';
import ReviewService from '../../src/services/review.service.js';
import ClientNoteService from '../../src/services/client-note.service.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../src/errors/index.js';
import { connectTestDatabase, disconnectTestDatabase } from '../helpers/database.js';

const ana = { id: 'ana-id', username: 'ana', role: 'CLIENT' };
const luis = { id: 'luis-id', username: 'luis', role: 'CLIENT' };
const sofi = { id: 'sofi-id', username: 'sofi', fullName: 'Sofi Rojas', role: 'STYLIST' };
const marta = { id: 'marta-id', username: 'marta', fullName: 'Marta', role: 'STYLIST' };
const admin = { id: 'admin-id', username: 'admin', fullName: 'Administradora', role: 'ADMIN' };

const appointment = overrides => Appointment.create({
  username: 'ana', service: 'Corte para Dama', stylist: 'sofi', date: '2030-01-07', time: '10:00 AM', status: 'COMPLETED', ...overrides
});

describe('Reseñas y notas', () => {
  let reviews;
  let notes;

  beforeAll(async () => {
    await connectTestDatabase('reviews_notes');
    await Promise.all([User.init(), Appointment.init(), Review.init(), ClientNote.init()]);
    await User.create([
      { username: 'ana', password: 'x', fullName: 'Ana María Pérez', email: 'ana@x.co', role: 'CLIENT' },
      { username: 'luis', password: 'x', fullName: 'Luis', email: 'luis@x.co', role: 'CLIENT' },
      { username: 'sofi', password: 'x', fullName: 'Sofi Rojas', email: 'sofi@x.co', role: 'STYLIST' }
    ]);
  });

  afterAll(disconnectTestDatabase);

  beforeEach(async () => {
    await Promise.all([Appointment.deleteMany({}), Review.deleteMany({}), ClientNote.deleteMany({})]);
    reviews = new ReviewService({ reviewModel: Review, appointmentModel: Appointment, userModel: User });
    notes = new ClientNoteService({ clientNoteModel: ClientNote, userModel: User, appointmentModel: Appointment });
  });

  describe('ReviewService', () => {
    it('abrevia el nombre del autor', () => {
      expect(ReviewService.shortName('Ana María Pérez')).toBe('Ana P.');
      expect(ReviewService.shortName('Luis')).toBe('Luis');
      expect(ReviewService.shortName('')).toBe('');
    });

    it('el cliente califica una cita completada una sola vez', async () => {
      const done = await appointment();
      const review = await reviews.create(ana, { appointmentId: done._id.toString(), rating: 5, comment: '  ¡Excelente!  ' });

      expect(review).toMatchObject({ username: 'ana', authorName: 'Ana P.', service: 'Corte para Dama', stylist: 'sofi', rating: 5, comment: '¡Excelente!' });
      await expect(reviews.create(ana, { appointmentId: done._id.toString(), rating: 4 }))
        .rejects.toThrow(new ConflictError('Ya calificaste esta cita.'));
      await expect(reviews.reviewedAppointmentIds(ana)).resolves.toEqual([done._id.toString()]);
    });

    it('rechaza citas ajenas, no completadas y calificaciones inválidas', async () => {
      const done = await appointment();
      const pending = await appointment({ status: 'CONFIRMED' });

      await expect(reviews.create(luis, { appointmentId: done._id.toString(), rating: 5 })).rejects.toBeInstanceOf(ForbiddenError);
      await expect(reviews.create(ana, { appointmentId: pending._id.toString(), rating: 5 }))
        .rejects.toThrow('Solo puedes calificar una cita completada.');
      await expect(reviews.create(ana, { appointmentId: done._id.toString(), rating: 6 })).rejects.toBeInstanceOf(ValidationError);
      await expect(reviews.create(ana, { appointmentId: done._id.toString(), rating: 4.5 })).rejects.toBeInstanceOf(ValidationError);
      await expect(reviews.create(ana, { appointmentId: done._id.toString(), rating: 5, comment: 'x'.repeat(501) }))
        .rejects.toBeInstanceOf(ValidationError);
      await expect(reviews.create(ana, { appointmentId: 'no-es-id', rating: 5 })).rejects.toBeInstanceOf(ValidationError);
    });

    it('lista reseñas públicas sin el usuario y resume promedios por servicio y estilista', async () => {
      const first = await appointment();
      const second = await appointment({ service: 'Masaje', stylist: '' });
      const third = await appointment({ time: '2:00 PM' });
      await reviews.create(ana, { appointmentId: first._id.toString(), rating: 5, comment: 'Muy bien' });
      await reviews.create(ana, { appointmentId: second._id.toString(), rating: 3 });
      await reviews.create(ana, { appointmentId: third._id.toString(), rating: 4 });

      const listed = await reviews.listPublic({ withComment: true });
      expect(listed).toHaveLength(1);
      expect(listed[0]).toMatchObject({ authorName: 'Ana P.', rating: 5, comment: 'Muy bien' });
      expect(listed[0]).not.toHaveProperty('username');
      await expect(reviews.listPublic({ service: 'Masaje' })).resolves.toHaveLength(1);

      await expect(reviews.summary()).resolves.toEqual({
        services: [{ name: 'Corte para Dama', average: 4.5, count: 2 }, { name: 'Masaje', average: 3, count: 1 }],
        stylists: [{ name: 'sofi', average: 4.5, count: 2 }]
      });
    });

    it('el administrador elimina una reseña', async () => {
      const done = await appointment();
      const review = await reviews.create(ana, { appointmentId: done._id.toString(), rating: 1, comment: 'spam' });
      await reviews.delete(review._id.toString());
      await expect(Review.countDocuments()).resolves.toBe(0);
      await expect(reviews.delete(review._id.toString())).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('ClientNoteService', () => {
    it('el estilista que atiende al cliente escribe y lee sus notas', async () => {
      await appointment({ status: 'CONFIRMED' });
      const note = await notes.create(sofi, 'ANA', { text: '  Alérgica al amoníaco  ' });

      expect(note).toMatchObject({ client: 'ana', author: 'sofi', authorName: 'Sofi Rojas', text: 'Alérgica al amoníaco' });
      await expect(notes.list(sofi, 'ana')).resolves.toHaveLength(1);
      await expect(notes.list(admin, 'ana')).resolves.toHaveLength(1);
    });

    it('otro estilista sin citas con el cliente no accede', async () => {
      await appointment();
      await expect(notes.list(marta, 'ana')).rejects.toBeInstanceOf(ForbiddenError);
      await expect(notes.create(marta, 'ana', { text: 'x' })).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('valida el cliente y el texto', async () => {
      await expect(notes.list(admin, 'sofi')).rejects.toBeInstanceOf(NotFoundError);
      await expect(notes.create(admin, 'ana', { text: '   ' })).rejects.toThrow('Escribe la nota.');
      await expect(notes.create(admin, 'ana', { text: 'x'.repeat(1001) })).rejects.toBeInstanceOf(ValidationError);
    });

    it('solo el autor o el administrador borran una nota', async () => {
      await appointment();
      await appointment({ stylist: 'marta' });
      const note = await notes.create(sofi, 'ana', { text: 'Prefiere la tarde' });

      await expect(notes.delete(note._id.toString(), marta)).rejects.toBeInstanceOf(ForbiddenError);
      await notes.delete(note._id.toString(), admin);
      await expect(ClientNote.countDocuments()).resolves.toBe(0);
    });
  });
});
