import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../../src/models/user.model.js';
import Appointment from '../../src/models/appointment.model.js';
import { createApp } from '../../src/app.js';
import CorsPolicy from '../../src/middlewares/cors.policy.js';
import { connectTestDatabase, disconnectTestDatabase } from '../helpers/database.js';

describe('API (integración)', () => {
  let app;

  beforeAll(async () => {
    await connectTestDatabase('api');
    await User.init();
    await User.create({
      username: 'admin',
      password: await bcrypt.hash('admin-clave-123', 4),
      fullName: 'Administradora',
      email: 'admin@spa.test',
      role: 'ADMIN'
    });
    app = createApp();
  });

  afterAll(disconnectTestDatabase);

  const newClient = { username: 'Carla', password: 'clave-segura', fullName: 'Carla Ruiz', email: 'carla@spa.test' };

  it('usa el MongoDB en memoria, nunca Atlas', () => {
    expect(mongoose.connection.host).toMatch(/^(127\.0\.0\.1|localhost)$/);
  });

  describe('CORS', () => {
    const productionApp = () => createApp({ corsPolicy: new CorsPolicy(['https://essence.vercel.app']) });

    it('permite al frontend de producción, incluida la verificación previa con Authorization', async () => {
      const preflight = await request(productionApp()).options('/api/users')
        .set('Origin', 'https://essence.vercel.app')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect(preflight.status).toBe(204);
      expect(preflight.headers['access-control-allow-origin']).toBe('https://essence.vercel.app');
      expect(preflight.headers['access-control-allow-headers']).toMatch(/authorization/i);
    });

    it('no entrega cabeceras CORS a otros orígenes', async () => {
      const res = await request(productionApp()).get('/api/health').set('Origin', 'https://otro.example');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  it('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  describe('POST /api/auth/register', () => {
    it('registra un cliente y devuelve token y usuario', async () => {
      const res = await request(app).post('/api/auth/register').send(newClient);

      expect(res.status).toBe(201);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toEqual({
        username: 'carla', fullName: 'Carla Ruiz', email: 'carla@spa.test', phoneNumber: '', role: 'CLIENT'
      });
      const stored = await User.findOne({ username: 'carla' });
      expect(stored.password).not.toBe(newClient.password);
    });

    it('responde 409 si el usuario ya existe', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...newClient, email: 'otra@spa.test' });
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'El nombre de usuario ya existe.' });
    });

    it('responde 400 con datos inválidos', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...newClient, username: 'otra', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('inicia sesión y el token sirve para /api/auth/me', async () => {
      const login = await request(app).post('/api/auth/login').send({ username: 'carla@spa.test', password: 'clave-segura' });
      expect(login.status).toBe(200);

      const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
      expect(me.status).toBe(200);
      expect(me.body.username).toBe('carla');
    });

    it('responde 401 con contraseña incorrecta', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'carla', password: 'equivocada' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Credenciales inválidas.' });
    });
  });

  describe('rutas de ADMIN', () => {
    const loginAs = async (username, password) =>
      (await request(app).post('/api/auth/login').send({ username, password })).body.token;

    it('GET /api/users responde 401 sin token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Acceso denegado. Token no proporcionado.' });
    });

    it('GET /api/users responde 403 con token de CLIENT', async () => {
      const token = await loginAs('carla', 'clave-segura');
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Acceso denegado. Permisos insuficientes.' });
    });

    it('POST /api/services responde 403 con token de CLIENT', async () => {
      const token = await loginAs('carla', 'clave-segura');
      const res = await request(app).post('/api/services').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Uñas', price: '$1' });
      expect(res.status).toBe(403);
    });

    it('GET /api/users responde 200 con token de ADMIN y no expone contraseñas', async () => {
      const token = await loginAs('admin', 'admin-clave-123');
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.map(user => user.username).sort()).toEqual(['admin', 'carla']);
      expect(res.body.every(user => !('password' in user))).toBe(true);
    });

    it('POST /api/users permite al ADMIN crear una cuenta de estilista que luego inicia sesión', async () => {
      const admin = await loginAs('admin', 'admin-clave-123');
      const res = await request(app).post('/api/users').set('Authorization', `Bearer ${admin}`)
        .send({ username: 'Lina', password: 'lina-clave-123', fullName: 'Lina Gómez', email: 'lina@spa.test', role: 'STYLIST' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ username: 'lina', fullName: 'Lina Gómez', email: 'lina@spa.test', role: 'STYLIST', isActive: true });
      expect(res.body).not.toHaveProperty('password');

      const stylists = await request(app).get('/api/users/stylists');
      expect(stylists.body.map(item => item.username)).toContain('lina');

      const login = await request(app).post('/api/auth/login').send({ username: 'lina', password: 'lina-clave-123' });
      expect(login.status).toBe(200);
      expect(login.body.user.role).toBe('STYLIST');

      const duplicate = await request(app).post('/api/users').set('Authorization', `Bearer ${admin}`)
        .send({ username: 'lina', password: 'lina-clave-123', fullName: 'Lina', email: 'otra@spa.test' });
      expect(duplicate.status).toBe(409);
    });

    it('POST /api/users responde 403 con token de CLIENT', async () => {
      const token = await loginAs('carla', 'clave-segura');
      const res = await request(app).post('/api/users').set('Authorization', `Bearer ${token}`)
        .send({ username: 'intruso', password: 'clave-segura', fullName: 'X', email: 'x@spa.test', role: 'ADMIN' });
      expect(res.status).toBe(403);
      expect(await User.exists({ username: 'intruso' })).toBeNull();
    });

    it('PUT /api/appointments/:id/status permite al estilista asignado completar una cita ya iniciada', async () => {
      const password = await bcrypt.hash('estilista-123', 4);
      await User.create([
        { username: 'sofi', password, fullName: 'Sofi', email: 'sofi@spa.test', role: 'STYLIST' },
        { username: 'marta', password, fullName: 'Marta', email: 'marta@spa.test', role: 'STYLIST' }
      ]);
      const base = { username: 'carla', service: 'Corte', stylist: 'sofi', time: '10:00 AM', status: 'CONFIRMED' };
      const [past, future] = await Appointment.create([
        { ...base, date: '2020-01-06' },
        { ...base, date: '2099-01-05' }
      ]);
      const sofi = await loginAs('sofi', 'estilista-123');
      const marta = await loginAs('marta', 'estilista-123');
      const complete = (id, token) => request(app).put(`/api/appointments/${id}/status`)
        .set('Authorization', `Bearer ${token}`).send({ status: 'COMPLETED' });

      const byOther = await complete(past._id, marta);
      expect(byOther.status).toBe(403);

      const tooEarly = await complete(future._id, sofi);
      expect(tooEarly.status).toBe(400);
      expect(tooEarly.body).toEqual({ error: 'No puedes completar una cita que todavía no ha empezado.' });

      const done = await complete(past._id, sofi);
      expect(done.status).toBe(200);
      expect(done.body.status).toBe('COMPLETED');

      const client = await loginAs('carla', 'clave-segura');
      const mine = await request(app).get('/api/appointments').set('Authorization', `Bearer ${client}`);
      expect(mine.body.find(item => item._id === String(past._id)).status).toBe('COMPLETED');

      const cancel = await request(app).put(`/api/appointments/${past._id}/status`)
        .set('Authorization', `Bearer ${client}`).send({ status: 'CANCELLED' });
      expect(cancel.status).toBe(400);
    });

    it('responde 403 con un token inválido', async () => {
      const res = await request(app).get('/api/users').set('Authorization', 'Bearer no-es-un-jwt');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Token inválido o expirado.' });
    });
  });

  describe('imágenes de servicios', () => {
    const loginAs = async (username, password) =>
      (await request(app).post('/api/auth/login').send({ username, password })).body.token;
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)]);

    it('el ADMIN sube una imagen, la usa en un servicio y cualquiera puede verla', async () => {
      const token = await loginAs('admin', 'admin-clave-123');
      const upload = await request(app).post('/api/service-images')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'image/png')
        .set('X-File-Name', encodeURIComponent('uñas.png'))
        .send(png);
      expect(upload.status).toBe(201);
      expect(upload.body).toMatchObject({ name: 'uñas.png', contentType: 'image/png', size: png.length });
      expect(upload.body.url).toBe(`/api/service-images/${upload.body._id}`);

      const service = await request(app).post('/api/services').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Uñas acrílicas', price: '$80.000', image: upload.body.url });
      expect(service.status).toBe(201);
      expect(service.body.image).toBe(upload.body.url);

      const image = await request(app).get(upload.body.url);
      expect(image.status).toBe(200);
      expect(image.headers['content-type']).toBe('image/png');
      expect(Buffer.compare(image.body, png)).toBe(0);

      const gallery = await request(app).get('/api/service-images').set('Authorization', `Bearer ${token}`);
      expect(gallery.status).toBe(200);
      expect(gallery.body.map(item => item.url)).toContain(upload.body.url);
      expect(gallery.body.every(item => !('data' in item))).toBe(true);
    });

    it('rechaza archivos que no son imágenes aunque digan serlo', async () => {
      const token = await loginAs('admin', 'admin-clave-123');
      const res = await request(app).post('/api/service-images')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'image/png')
        .send(Buffer.from('<script>alert(1)</script>'));
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Formato no admitido. Usa una imagen JPG, PNG o WebP.' });
    });

    it('rechaza imágenes de más de 5 MB', async () => {
      const token = await loginAs('admin', 'admin-clave-123');
      const res = await request(app).post('/api/service-images')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'image/png')
        .send(Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)]));
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'La imagen no puede superar 5 MB.' });
    });

    it('solo el ADMIN puede subir imágenes', async () => {
      const token = await loginAs('carla', 'clave-segura');
      const res = await request(app).post('/api/service-images')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'image/png')
        .send(png);
      expect(res.status).toBe(403);
    });

    it('responde 404 si la imagen no existe', async () => {
      const res = await request(app).get('/api/service-images/no-existe');
      expect(res.status).toBe(404);
    });
  });
});
