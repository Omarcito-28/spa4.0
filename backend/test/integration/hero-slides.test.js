import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import User from '../../src/models/user.model.js';
import { createApp } from '../../src/app.js';
import { connectTestDatabase, disconnectTestDatabase } from '../helpers/database.js';

describe('Carrusel de la portada (integración)', () => {
  let app;
  let admin;
  let client;

  const login = async (username, password) =>
    `Bearer ${(await request(app).post('/api/auth/login').send({ username, password })).body.token}`;

  beforeAll(async () => {
    await connectTestDatabase('hero');
    const password = await bcrypt.hash('clave-segura-1', 4);
    await User.create([
      { username: 'admin', password, fullName: 'Admin', email: 'admin@spa.test', role: 'ADMIN' },
      { username: 'ana', password, fullName: 'Ana', email: 'ana@spa.test', role: 'CLIENT' },
    ]);
    app = createApp();
    admin = await login('admin', 'clave-segura-1');
    client = await login('ana', 'clave-segura-1');
  });

  afterAll(disconnectTestDatabase);

  const add = (image, alt = '') => request(app).post('/api/hero-slides').set('Authorization', admin).send({ image, alt });

  it('sin diapositivas, la portada recibe una lista vacía (usa las predeterminadas)', async () => {
    const res = await request(app).get('/api/hero-slides');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('solo el administrador gestiona el carrusel', async () => {
    expect((await request(app).get('/api/hero-slides/all')).status).toBe(401);
    expect((await request(app).post('/api/hero-slides').set('Authorization', client).send({ image: '/images/a.jpg' })).status).toBe(403);
  });

  it('agrega imágenes del sitio en orden y rechaza rutas externas o inválidas', async () => {
    const first = await add('/images/services/corte_dama.jpg', 'Corte de cabello');
    const second = await add('/api/service-images/0123456789abcdef01234567');
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ image: '/images/services/corte_dama.jpg', alt: 'Corte de cabello', position: 0, isActive: true });
    expect(second.body.position).toBe(1);

    for (const image of ['https://otro-sitio.com/a.jpg', '/images/../secreto.jpg', '/images/a.jpg) no-repeat; color: red', 'javascript:alert(1)', '']) {
      expect((await add(image)).status).toBe(400);
    }
  });

  it('oculta, describe, reordena y quita diapositivas', async () => {
    const all = (await request(app).get('/api/hero-slides/all').set('Authorization', admin)).body;
    const [first, second] = all;

    const hidden = await request(app).put(`/api/hero-slides/${first._id}`).set('Authorization', admin).send({ isActive: false, alt: 'Nuevo texto' });
    expect(hidden.body).toMatchObject({ isActive: false, alt: 'Nuevo texto' });
    expect((await request(app).get('/api/hero-slides')).body.map(slide => slide._id)).toEqual([second._id]);

    const reordered = await request(app).put('/api/hero-slides/order').set('Authorization', admin).send({ ids: [second._id, first._id] });
    expect(reordered.status).toBe(200);
    expect(reordered.body.map(slide => slide._id)).toEqual([second._id, first._id]);

    const incomplete = await request(app).put('/api/hero-slides/order').set('Authorization', admin).send({ ids: [second._id] });
    expect(incomplete.status).toBe(400);

    expect((await request(app).delete(`/api/hero-slides/${first._id}`).set('Authorization', admin)).status).toBe(200);
    expect((await request(app).delete(`/api/hero-slides/${first._id}`).set('Authorization', admin)).status).toBe(404);
    expect((await request(app).put('/api/hero-slides/no-es-un-id').set('Authorization', admin).send({ alt: 'x' })).status).toBe(404);
  });

  it('limita el carrusel a 10 imágenes', async () => {
    const existing = (await request(app).get('/api/hero-slides/all').set('Authorization', admin)).body.length;
    for (let index = existing; index < 10; index += 1) {
      expect((await add('/images/services/masaje.jpg')).status).toBe(201);
    }
    const extra = await add('/images/services/masaje.jpg');
    expect(extra.status).toBe(400);
    expect(extra.body.error).toMatch(/hasta 10/);
  });
});
