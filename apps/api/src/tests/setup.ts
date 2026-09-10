import { beforeEach } from 'vitest';

// Estas variables tienen que estar puestas antes de que ningún módulo lea la
// configuración; de ahí que esto vaya en `setupFiles` y no dentro de un test.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas-1234567890';

const { prisma } = await import('../lib/prisma.js');

// Cada test arranca con la base vacía. Si no, acabas con tests que solo pasan en
// un orden concreto y nadie sabe por qué.
beforeEach(async () => {
  await prisma.collectionEntry.deleteMany();
  await prisma.user.deleteMany();
});
