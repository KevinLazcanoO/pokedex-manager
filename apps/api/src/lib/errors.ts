// Cualquier capa puede lanzarlo y el manejador central lo convierte en respuesta.
// Es lo que permite que los servicios no sepan nada de `res`.
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new HttpError(400, message, fields);

export const unauthorized = (message = 'Necesitas iniciar sesión') =>
  new HttpError(401, message);

export const notFound = (message = 'Recurso no encontrado') => new HttpError(404, message);

export const conflict = (message: string, fields?: Record<string, string>) =>
  new HttpError(409, message, fields);

export const badGateway = (message: string) => new HttpError(502, message);
