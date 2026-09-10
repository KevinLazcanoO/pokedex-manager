import type { ZodType } from 'zod';

type Resultado<T> =
  | { ok: true; data: T }
  | { ok: false; fields: Record<string, string> };

/**
 * Valida un formulario con el mismo esquema de Zod que usa el backend.
 *
 * Para esto existe `@pokedex/shared`: las reglas se escriben una vez. El navegador
 * responde al instante y el servidor vuelve a validar igualmente, porque de lo que
 * llega del cliente no se fía nadie.
 */
export function validateForm<T>(schema: ZodType<T>, values: unknown): Resultado<T> {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    // Solo el primer problema de cada campo: tres mensajes bajo un mismo input
    // agobian más de lo que ayudan.
    fields[key] ??= issue.message;
  }

  return { ok: false, fields };
}
