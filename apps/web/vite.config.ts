import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // El navegador siempre habla con su propio origen (localhost:5173) y Vite
      // reenvía /api al backend. Con esto no hay CORS que configurar y la cookie
      // de sesión viaja como si todo fuera la misma aplicación.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
