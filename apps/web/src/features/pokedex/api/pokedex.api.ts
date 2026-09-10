import type { PokemonDetail, PokemonListResult, PokemonQuery } from '@pokedex/shared';

import { apiRequest } from '../../../lib/api-client';

/**
 * La PokéAPI no se toca desde el navegador, se pide a nuestro backend.
 *
 * Así el servidor cachea, normaliza y resuelve la búsqueda, y el frontend recibe
 * justo lo que va a pintar. De paso, la aplicación depende de una sola API.
 */

export function fetchPokemonList(query: Partial<PokemonQuery>): Promise<PokemonListResult> {
  return apiRequest<PokemonListResult>('/pokemon', {
    query: {
      search: query.search,
      type: query.type,
      page: query.page,
      pageSize: query.pageSize,
    },
  });
}

export function fetchPokemonTypes(): Promise<string[]> {
  return apiRequest<string[]>('/pokemon/types');
}

export function fetchPokemonDetail(idOrName: string): Promise<PokemonDetail> {
  return apiRequest<PokemonDetail>(`/pokemon/${encodeURIComponent(idOrName)}`);
}
