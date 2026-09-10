import type { ErrorRequestHandler, RequestHandler } from 'express';

import type { ApiErrorBody } from '@pokedex/shared';

import { HttpError } from '../lib/errors.js';
import { isProduction } from '../config/env.js';

/** Cualquier ruta que no exista acaba aquí. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiErrorBody = {
    error: { message: `No existe la ruta ${req.method} ${req.originalUrl}` },
  };
  res.status(404).json(body);
};

/**
 * El único sitio donde un error se convierte en respuesta HTTP.
 *
 * Express 5 manda aquí también las promesas rechazadas de los controladores, así
 * que no hay que envolver cada handler en un try/catch.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ApiErrorBody = {
      error: { message: err.message, ...(err.fields && { fields: err.fields }) },
    };
    res.status(err.status).json(body);
    return;
  }

  // Un error inesperado es culpa nuestra: se registra entero en el servidor, pero
  // al cliente solo le llega un mensaje genérico. Los detalles internos no salen.
  console.error('Error no controlado:', err);

  const body: ApiErrorBody = {
    error: {
      message: isProduction
        ? 'Ocurrió un error inesperado'
        : err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado',
    },
  };
  res.status(500).json(body);
};
