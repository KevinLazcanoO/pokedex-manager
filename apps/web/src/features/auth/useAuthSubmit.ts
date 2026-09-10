import { useState } from 'react';
import type { ZodType } from 'zod';

import { ApiError } from '../../lib/api-client';
import { validateForm } from '../../lib/validation';

interface Estado<T> {
  errores: Record<string, string>;
  /** El error que no pertenece a ningún campo concreto. */
  mensaje: string | null;
  enviando: boolean;
  enviar: (valores: unknown) => Promise<void>;
  /** Para borrar el error de un campo en cuanto el usuario lo corrige. */
  limpiarError: (campo: keyof T & string) => void;
}

/**
 * Envío de los formularios de sesión: valida, llama a la acción y traduce los
 * fallos a algo que la pantalla pueda enseñar.
 *
 * Entrar y crear cuenta hacen exactamente esto mismo, así que vive aquí en vez de
 * duplicado en las dos.
 */
export function useAuthSubmit<T>(schema: ZodType<T>, accion: (datos: T) => Promise<void>): Estado<T> {
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function limpiarError(campo: string) {
    setErrores((previos) => {
      if (!(campo in previos)) return previos; // misma referencia, ningún re-render
      const { [campo]: _descartado, ...resto } = previos;
      return resto;
    });
  }

  async function enviar(valores: unknown) {
    // Primero se valida en local: es instantáneo y ahorra un viaje al servidor
    // para decirle al usuario algo que ya sabemos desde aquí.
    const validacion = validateForm(schema, valores);
    if (!validacion.ok) {
      setErrores(validacion.fields);
      setMensaje(null);
      return;
    }

    setErrores({});
    setMensaje(null);
    setEnviando(true);

    try {
      await accion(validacion.data);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        // El servidor sabe cosas que el navegador no, como que ese correo ya existe.
        setErrores(error.fields);
      } else if (error instanceof ApiError) {
        setMensaje(error.message);
      } else {
        setMensaje('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      // En `finally` para que el botón vuelva a la vida también cuando falla.
      setEnviando(false);
    }
  }

  return { errores, mensaje, enviando, enviar, limpiarError };
}
