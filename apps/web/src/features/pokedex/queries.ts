import { useQuery } from '@tanstack/react-query';

import type { PokemonQuery } from '@pokedex/shared';

import { fetchPokemonDetail, fetchPokemonList, fetchPokemonTypes } from './api/pokedex.api';

// Los datos de la PokéAPI no cambian nunca en la práctica, así que se cachean sin
// miedo: moverse entre páginas y volver atrás sale instantáneo.

const UNA_HORA = 60 * 60 * 1000;

export function usePokemonList(query: Partial<PokemonQuery>) {
  return useQuery({
    // La clave lleva los filtros dentro, así que cada combinación se cachea por
    // separado y volver a una búsqueda anterior no pide nada.
    queryKey: ['pokemon', 'list', query],
    queryFn: () => fetchPokemonList(query),
    staleTime: UNA_HORA,
    // Deja en pantalla la página anterior mientras llega la siguiente, en lugar
    // de vaciar el grid y provocar un salto en cada cambio.
    placeholderData: (anterior) => anterior,
  });
}

export function usePokemonTypes() {
  return useQuery({
    queryKey: ['pokemon', 'types'],
    queryFn: fetchPokemonTypes,
    staleTime: UNA_HORA,
  });
}

export function usePokemonDetail(idOrName: string) {
  return useQuery({
    queryKey: ['pokemon', 'detail', idOrName],
    queryFn: () => fetchPokemonDetail(idOrName),
    staleTime: UNA_HORA,
  });
}
