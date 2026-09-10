import type { ApiErrorBody } from '@pokedex/shared';

// El error de la API ya interpretado. Los componentes trabajan con esto y no con
// un `Response`: miran `status` o `fields` sin volver a parsear el cuerpo.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Parámetros de consulta. Los `undefined` se caen solos. */
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) return `/api${path}`;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // Un filtro vacío no puede viajar como `?type=`, o el backend entendería que
    // se filtra por cadena vacía en lugar de que no hay filtro.
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `/api${path}?${queryString}` : `/api${path}`;
}

/**
 * Todo lo que el frontend le pide al backend pasa por aquí.
 *
 * Concentrarlo significa que la cabecera de JSON, el manejo de errores y la forma
 * de las URLs se escriben una vez y no en cada pantalla.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      // La cookie de sesión es `httpOnly`: el navegador la manda solo, aquí basta
      // con dejarle.
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  if (!response.ok) {
    // Si el servidor se cayó de una forma que no devuelve JSON, el parseo lanzaría
    // otro error distinto y taparía el problema de verdad.
    const parsed = (await response.json().catch(() => null)) as ApiErrorBody | null;

    throw new ApiError(
      response.status,
      parsed?.error.message ?? 'Ocurrió un error inesperado',
      parsed?.error.fields,
    );
  }

  // Un 204 (borrar, cerrar sesión) no trae cuerpo que parsear.
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
