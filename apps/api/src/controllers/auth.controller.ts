import type { RequestHandler } from 'express';

import type { LoginInput, RegisterInput } from '@pokedex/shared';

import { clearSession, createSession } from '../lib/session.js';
import * as authService from '../services/auth.service.js';

// Los controladores solo traducen entre HTTP y el servicio: leen la petición,
// llaman a la lógica de negocio y escriben la respuesta. Aquí no hay reglas.

export const registerHandler: RequestHandler = async (req, res) => {
  const user = await authService.register(req.body as RegisterInput);

  // Registrarse deja la sesión abierta. Obligar a iniciar sesión justo después
  // solo añade un paso que no le sirve a nadie.
  createSession(res, { sub: user.id, email: user.email });
  res.status(201).json(user);
};

export const loginHandler: RequestHandler = async (req, res) => {
  const user = await authService.login(req.body as LoginInput);

  createSession(res, { sub: user.id, email: user.email });
  res.json(user);
};

export const logoutHandler: RequestHandler = (_req, res) => {
  clearSession(res);
  res.status(204).end();
};

export const meHandler: RequestHandler = async (req, res) => {
  // `requireAuth` va delante, así que aquí `req.user` siempre está.
  const user = await authService.getCurrentUser(req.user!.id);
  res.json(user);
};
