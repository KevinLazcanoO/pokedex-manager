import bcrypt from 'bcryptjs';

import type { LoginInput, PublicUser, RegisterInput } from '@pokedex/shared';
import type { User } from '@prisma/client';

import { conflict, unauthorized } from '../lib/errors.js';
import { createUser, findUserByEmail, findUserById } from '../repositories/user.repository.js';

const SALT_ROUNDS = 10;

/** Quita el hash antes de que el usuario salga de esta capa. */
function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw conflict('Ese correo ya está registrado', { email: 'Ese correo ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await createUser({
    email: input.email,
    passwordHash,
    displayName: input.displayName,
  });

  return toPublicUser(user);
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const user = await findUserByEmail(input.email);

  // Aunque el correo no exista se compara igualmente contra un hash.
  const hash = user?.passwordHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
  const matches = await bcrypt.compare(input.password, hash);

  if (!user || !matches) {
    // Mensaje vago a propósito: no dice si falló el correo o la contraseña.
    throw unauthorized('Correo o contraseña incorrectos');
  }

  return toPublicUser(user);
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) throw unauthorized('Tu sesión ya no es válida');

  return toPublicUser(user);
}
