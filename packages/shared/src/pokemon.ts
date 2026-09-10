import { z } from 'zod';

// La PokéAPI devuelve respuestas enormes y muy anidadas. El backend las traduce a
// estos tipos, así que el frontend recibe solo lo que va a pintar.

export interface PokemonSummary {
  pokemonId: number;
  name: string;
  spriteUrl: string | null;
  types: string[];
  /** Suma de las seis estadísticas base: una medida rápida de lo fuerte que es. */
  baseStatTotal: number;
}

export interface PokemonStat {
  name: string;
  value: number;
}

export interface PokemonDetail extends PokemonSummary {
  /** En metros. La PokéAPI la da en decímetros; la conversión se hace en el backend. */
  height: number;
  /** En kilogramos. La PokéAPI lo da en hectogramos. */
  weight: number;
  abilities: string[];
  stats: PokemonStat[];
  artworkUrl: string | null;
}

export interface PokemonListResult {
  items: PokemonSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const POKEMON_PAGE_SIZE = 24;

export const pokemonQuerySchema = z.object({
  search: z.string().trim().toLowerCase().max(50).optional(),
  type: z.string().trim().toLowerCase().max(20).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(48).default(POKEMON_PAGE_SIZE),
});

export type PokemonQuery = z.infer<typeof pokemonQuerySchema>;
