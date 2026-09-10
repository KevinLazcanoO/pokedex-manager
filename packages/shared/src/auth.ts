import { z } from 'zod';

// Los esquemas viven en el paquete compartido para que el formulario del navegador
// y el endpoint del servidor validen con las mismas reglas. Si mañana sube el
// mínimo de la contraseña, se cambia aquí y ya está.

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'El correo es obligatorio')
  .email('Escribe un correo válido');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres'); // limite real de bcrypt

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(40, 'El nombre no puede superar los 40 caracteres'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Lo que el servidor devuelve del usuario. Nunca incluye el hash de la contraseña. */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}
