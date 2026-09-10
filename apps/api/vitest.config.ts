import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Comparten un único archivo SQLite, así que en serie para que no se pisen.
    fileParallelism: false,
    // Limpia el historial de los dobles antes de cada test. Sin esto, un
    // `toHaveBeenCalled` ve las llamadas del test anterior y pasa cuando no debe.
    clearMocks: true,
    globalSetup: ['./src/tests/global-setup.ts'],
    setupFiles: ['./src/tests/setup.ts'],
  },
});
