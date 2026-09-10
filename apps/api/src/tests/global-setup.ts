import { execSync } from 'node:child_process';

/**
 * Corre una sola vez antes de toda la suite. Sincroniza el esquema contra un
 * SQLite propio de las pruebas para no tocar el de desarrollo. Vaciar las tablas
 * entre tests ya lo hace `setup.ts`, así que no hace falta borrar el archivo.
 */
export default function globalSetup(): void {
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
}
