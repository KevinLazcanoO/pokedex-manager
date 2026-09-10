import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { LoginInput, PublicUser, RegisterInput } from '@pokedex/shared';

import { AuthContext, type AuthContextValue } from './auth-context';
import * as authApi from './api/auth.api';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

/**
 * La sesión, en un solo sitio.
 *
 * Manda el servidor: al arrancar se pregunta por `/auth/me` en lugar de guardar el
 * usuario en `localStorage`, que se queda desincronizado en cuanto la sesión caduca
 * y te deja la interfaz diciendo "Hola, Daniel" sin sesión ninguna.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.fetchCurrentUser,
    // Sin `retry` propio, se aplica la política global: nada de reintentos en los
    // 4xx y uno para el resto. Importa aquí porque con `npm run dev` la interfaz
    // está lista antes que la API y esta primera petición puede fallar. Sin
    // reintento, el usuario acabaría en el login teniendo la sesión abierta.
    staleTime: Infinity,
  });

  const guardarUsuario = useCallback(
    (nuevoUsuario: PublicUser) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, nuevoUsuario);
    },
    [queryClient],
  );

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: guardarUsuario,
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: guardarUsuario,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      // Se limpia la caché entera, no solo la sesión: la colección de quien acaba
      // de salir no puede seguir en memoria para el siguiente que entre.
      queryClient.clear();
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      comprobandoSesion: isPending,
      login: async (input) => {
        await loginMutation.mutateAsync(input);
      },
      register: async (input) => {
        await registerMutation.mutateAsync(input);
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
    }),
    [user, isPending, loginMutation, registerMutation, logoutMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
