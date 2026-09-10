import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { badRequest } from '../lib/errors.js';

type Source = 'body' | 'query' | 'params';

/**
 * Valida una parte de la petición contra un esquema y sustituye el valor original
 * por el ya parseado, con los valores por defecto y los tipos convertidos.
 *
 * A partir de aquí los controladores reciben datos en los que pueden confiar, y se
 * ahorran el bloque de comprobaciones manuales al principio de cada función.
 */
export function validate(source: Source, schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      // Zod devuelve una lista de problemas; el formulario del frontend necesita
      // un mapa campo -> mensaje para pintar cada error bajo su input.
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || source;
        fields[key] ??= issue.message;
      }

      next(badRequest('Los datos enviados no son válidos', fields));
      return;
    }

    // En Express 5 `req.query` es de solo lectura, de ahí el defineProperty.
    Object.defineProperty(req, source, { value: result.data, writable: true });
    next();
  };
}
