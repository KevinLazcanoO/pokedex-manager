import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from './auth-context';

/**
 * La sesión, desde cualquier componente.
 *
 * Usarlo fuera del proveedor falla aquí mismo y con un mensaje claro, en vez de
 * devolver `undefined` y reventar tres capas más abajo.
 */
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }

  return contexto;
}
