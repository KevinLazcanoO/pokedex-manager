import type { LoginInput, PublicUser, RegisterInput } from '@pokedex/shared';

import { ApiError, apiRequest } from '../../../lib/api-client';

/**
 * No tener sesión no es un fallo, es uno de los dos estados normales de la
 * aplicación. Por eso un 401 aquí se convierte en `null` en vez de propagarse como
 * error, y las pantallas solo tienen que mirar si hay usuario o no.
 */
export async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    return await apiRequest<PublicUser>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function login(input: LoginInput): Promise<PublicUser> {
  return apiRequest<PublicUser>('/auth/login', { method: 'POST', body: input });
}

export function register(input: RegisterInput): Promise<PublicUser> {
  return apiRequest<PublicUser>('/auth/register', { method: 'POST', body: input });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}
