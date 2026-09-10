import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CollectionEntry,
  CollectionQuery,
  CreateEntryInput,
  UpdateEntryInput,
} from '@pokedex/shared';

import {
  addToCollection,
  deleteEntry,
  fetchCollection,
  fetchStats,
  updateEntry,
} from './api/collection.api';

/** La raíz de todas las claves de la colección, para invalidarlas de golpe. */
const COLLECTION_KEY = ['collection'] as const;
const LIST_KEY = [...COLLECTION_KEY, 'list'] as const;

export function useCollectionStats() {
  return useQuery({
    queryKey: [...COLLECTION_KEY, 'stats'],
    queryFn: fetchStats,
  });
}

export function useCollection(query: Partial<CollectionQuery> = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, query],
    queryFn: () => fetchCollection(query),
  });
}

/**
 * Los ids que el usuario ya tiene, para marcar las tarjetas de Explorar.
 *
 * Reutiliza la consulta del listado sin filtros: misma clave, misma caché. No
 * cuesta una petición extra, solo transforma el resultado con `select`.
 */
export function useCapturedIds() {
  return useQuery({
    queryKey: [...LIST_KEY, {}],
    queryFn: () => fetchCollection(),
    select: (entradas: CollectionEntry[]) => new Set(entradas.map((e) => e.pokemonId)),
  });
}

export function useAddToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEntryInput) => addToCollection(input),
    onSuccess: () => {
      // Al capturar cambian el listado y las estadísticas. Invalidando la raíz
      // caducan todos de golpe, sin ir enumerando claves a mano.
      void queryClient.invalidateQueries({ queryKey: COLLECTION_KEY });
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...cambios }: UpdateEntryInput & { id: string }) =>
      updateEntry(id, cambios),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COLLECTION_KEY });
    },
  });
}

/**
 * Marcar o desmarcar favorito, con actualización optimista.
 *
 * Es la única mutación optimista de la aplicación, y a propósito: es la acción que
 * más se repite y la que peor sienta con retraso. Esperar al servidor para pintar
 * una estrella se nota muchísimo; al capturar o borrar, en cambio, nadie protesta
 * por una espera corta.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      updateEntry(id, { favorite }),

    onMutate: async ({ id, favorite }) => {
      // Se cancelan las peticiones en vuelo. Si una llegara después de pintar el
      // cambio, machacaría la interfaz con el valor viejo.
      await queryClient.cancelQueries({ queryKey: LIST_KEY });

      const anteriores = queryClient.getQueriesData<CollectionEntry[]>({ queryKey: LIST_KEY });

      // Se parchea cada listado en caché; hay uno por combinación de filtros.
      queryClient.setQueriesData<CollectionEntry[]>({ queryKey: LIST_KEY }, (entradas) =>
        entradas?.map((entrada) => (entrada.id === id ? { ...entrada, favorite } : entrada)),
      );

      // Lo que se devuelve aquí llega a `onError` como contexto, para deshacerlo.
      return { anteriores };
    },

    onError: (_error, _variables, contexto) => {
      for (const [clave, datos] of contexto?.anteriores ?? []) {
        queryClient.setQueryData(clave, datos);
      }
    },

    onSettled: () => {
      // Salga bien o mal se vuelve a preguntar: el contador de favoritos del panel
      // de estadísticas también ha cambiado.
      void queryClient.invalidateQueries({ queryKey: COLLECTION_KEY });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COLLECTION_KEY });
    },
  });
}
