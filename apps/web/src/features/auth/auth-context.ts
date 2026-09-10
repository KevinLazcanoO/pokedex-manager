import { createContext } from 'react';

import type { LoginInput, PublicUser, RegisterInput } from '@pokedex/shared';

export interface AuthContextValue {
  /** `null` es "comprobado y sin sesión", no "todavía no se sabe". */
  user: PublicUser | null;
  /** `true` mientras se comprueba la sesión al abrir la aplicación. */
  comprobandoSesion: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * El contexto va en su propio archivo, aparte del proveedor.
 *
 * Es por algo muy práctico: el recargado en caliente de React solo funciona bien si
 * un archivo exporta únicamente componentes. Si mezclas contexto y proveedor, cada
 * guardado recarga la página entera y pierdes el estado.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
