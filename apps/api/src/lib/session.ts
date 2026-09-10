import type { Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { env, isProduction } from '../config/env.js';

const COOKIE_NAME = 'pokedex_session';

interface SessionPayload {
  sub: string;
  email: string;
}

/**
 * El token va en una cookie `httpOnly` y no en `localStorage`, que lo puede leer
 * cualquier script de la página: un XSS se llevaría la sesión entera. El precio
 * de la cookie es tener que pensar en CSRF, y de eso se ocupa `sameSite: 'lax'`.
 */
export function createSession(res: Response, payload: SessionPayload): void {
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

  // Se lee el `exp` del propio token en lugar de repetir la duración en dos
  // formatos, que es la típica pareja que acaba desincronizada.
  const { exp } = jwt.decode(token) as { exp: number };

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction, // en desarrollo el servidor es http y la cookie no viajaría
    path: '/',
    expires: new Date(exp * 1000),
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/' });
}

/** El contenido del token, o `null` si no hay cookie o no es válida. */
export function readSession(cookies: Record<string, string | undefined>): SessionPayload | null {
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'string') return null;

    return { sub: String(payload.sub), email: String(payload.email) };
  } catch {
    // Caducado o manipulado da igual: para el resto del sistema es no tener sesión.
    return null;
  }
}
