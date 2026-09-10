import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

const app = createApp();

const nuevoUsuario = {
  email: 'ash@pueblopaleta.com',
  password: 'pikachu2026',
  displayName: 'Ash Ketchum',
};

describe('POST /api/auth/register', () => {
  it('crea el usuario, lo devuelve sin la contrasena y deja la sesion iniciada', async () => {
    const res = await request(app).post('/api/auth/register').send(nuevoUsuario);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: nuevoUsuario.email,
      displayName: nuevoUsuario.displayName,
    });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie']?.[0]).toContain('pokedex_session=');
  });

  it('rechaza un correo repetido con 409', async () => {
    await request(app).post('/api/auth/register').send(nuevoUsuario);
    const res = await request(app).post('/api/auth/register').send(nuevoUsuario);

    expect(res.status).toBe(409);
    expect(res.body.error.fields).toHaveProperty('email');
  });

  it('rechaza una contrasena corta con 400 y senala el campo', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...nuevoUsuario, password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('password');
  });
});

describe('POST /api/auth/login', () => {
  it('inicia sesion con las credenciales correctas', async () => {
    await request(app).post('/api/auth/register').send(nuevoUsuario);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: nuevoUsuario.email, password: nuevoUsuario.password });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(nuevoUsuario.email);
  });

  it('devuelve el mismo 401 generico exista o no el correo', async () => {
    await request(app).post('/api/auth/register').send(nuevoUsuario);

    const claveMala = await request(app)
      .post('/api/auth/login')
      .send({ email: nuevoUsuario.email, password: 'claveIncorrecta' });

    const correoInexistente = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@example.com', password: 'claveIncorrecta' });

    expect(claveMala.status).toBe(401);
    expect(correoInexistente.status).toBe(401);
    expect(claveMala.body.error.message).toBe(correoInexistente.body.error.message);
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve 401 sin sesion', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('devuelve el usuario cuando la cookie de sesion es valida', async () => {
    const agent = request.agent(app); // el agente guarda las cookies entre peticiones
    await agent.post('/api/auth/register').send(nuevoUsuario);

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(nuevoUsuario.email);
  });

  it('deja de reconocer al usuario despues de cerrar sesion', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(nuevoUsuario);
    await agent.post('/api/auth/logout');

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
