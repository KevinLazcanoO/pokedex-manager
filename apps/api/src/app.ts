import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';

import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

/**
 * Construye la aplicación sin ponerla a escuchar.
 *
 * Separar construir de arrancar es lo que deja que los tests la levanten en
 * memoria con supertest, sin ocupar un puerto de verdad.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', apiRouter);

  // El orden importa: rutas, luego el 404 y el manejador de errores al final,
  // que Express reconoce por tener cuatro parámetros.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
