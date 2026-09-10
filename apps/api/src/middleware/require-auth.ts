import type { RequestHandler } from 'express';

import { unauthorized } from '../lib/errors.js';
import { readSession } from '../lib/session.js';

// Puerta de las rutas privadas: sin sesión válida no se pasa. Cuando pasa, deja
// el usuario en `req.user` para el resto de la cadena.
export const requireAuth: RequestHandler = (req, _res, next) => {
  const session = readSession(req.cookies ?? {});

  if (!session) {
    next(unauthorized());
    return;
  }

  req.user = { id: session.sub, email: session.email };
  next();
};
