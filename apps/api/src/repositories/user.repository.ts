import type { User } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

// El único módulo que sabe cómo se guardan los usuarios. Si mañana SQLite pasa a
// ser Postgres, u ORM por otro, el resto de la aplicación ni se entera.

export function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: {
  email: string;
  passwordHash: string;
  displayName: string;
}): Promise<User> {
  return prisma.user.create({ data });
}
