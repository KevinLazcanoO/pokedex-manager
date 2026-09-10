import { z } from 'zod';

// Se validan una sola vez, al arrancar. Mejor que el proceso muera ya con un
// mensaje claro a que arranque sin JWT_SECRET y reviente cuando alguien intente
// iniciar sesión.
//
// El .env lo carga Node con --env-file-if-exists (ver los scripts), así que no
// hace falta dotenv.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'Falta DATABASE_URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // El análisis con IA es opcional: sin clave la función se apaga sola y la
  // aplicación funciona igual. Nadie que clone el repositorio hace una llamada
  // externa sin querer, ni necesita una cuenta para probar el resto.
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  AI_LIMITE_POR_USUARIO_AL_DIA: z.coerce.number().int().positive().default(10),
  AI_LIMITE_GLOBAL_AL_DIA: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Se listan todos los problemas de golpe, no el primero: si faltan tres
  // variables, es mejor enterarse de las tres a la vez.
  const detalle = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  console.error(`No se pudo arrancar la API. Revisa tu archivo .env:\n${detalle}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';

/** Si no hay clave, el análisis con IA no existe para el resto del programa. */
export const analisisIaActivo = env.ANTHROPIC_API_KEY !== undefined;
