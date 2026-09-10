import type { PokemonDetail, PokemonListResult, PokemonQuery, PokemonSummary } from '@pokedex/shared';

import { TtlCache } from '../lib/cache.js';
import { badGateway, notFound } from '../lib/errors.js';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// La PokéAPI no tiene búsqueda por texto ni filtros combinados, así que este
// servicio se los monta encima: baja una sola vez el índice completo de nombres,
// filtra en memoria y solo pide el detalle de los de la página actual.

/** Las formas alternativas (megas, variantes regionales) empiezan en el id 10000. */
const MAX_BASE_POKEMON_ID = 10000;

const TIPOS_SIN_POKEMON = new Set(['unknown', 'stellar', 'shadow']);

interface IndexEntry {
  pokemonId: number;
  name: string;
}

// Respuestas crudas de la PokéAPI. Solo se declara lo que de verdad se usa; el
// resto de campos que devuelve son muchos y no nos hacen falta.
interface RawNamedResource {
  name: string;
  url: string;
}

interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
    other?: { 'official-artwork'?: { front_default: string | null } };
  };
  types: Array<{ type: RawNamedResource }>;
  abilities: Array<{ ability: RawNamedResource }>;
  stats: Array<{ base_stat: number; stat: RawNamedResource }>;
}

const indexCache = new TtlCache<IndexEntry[]>(ONE_DAY_MS);
const detailCache = new TtlCache<PokemonDetail>(ONE_DAY_MS);
const typeMembersCache = new TtlCache<Set<number>>(ONE_DAY_MS);
const typeNamesCache = new TtlCache<string[]>(ONE_DAY_MS);

/** El único punto que toca la red. Traduce los fallos externos a errores propios. */
async function fetchFromPokeApi<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${POKEAPI_BASE}${path}`);
  } catch {
    throw badGateway('No se pudo conectar con la PokéAPI. Inténtalo de nuevo en un momento.');
  }

  if (response.status === 404) {
    throw notFound('Ese Pokémon no existe en la PokéAPI');
  }

  if (!response.ok) {
    throw badGateway(`La PokéAPI respondió con un error (${response.status})`);
  }

  return (await response.json()) as T;
}

/** En el índice el id no viene como campo, hay que sacarlo de la URL. */
function pokemonIdFromUrl(url: string): number {
  const match = /\/pokemon\/(\d+)\/?$/.exec(url);
  return match?.[1] ? Number(match[1]) : Number.NaN;
}

function toDetail(raw: RawPokemon): PokemonDetail {
  const stats = raw.stats.map((entry) => ({ name: entry.stat.name, value: entry.base_stat }));

  return {
    pokemonId: raw.id,
    name: raw.name,
    spriteUrl: raw.sprites.front_default,
    artworkUrl: raw.sprites.other?.['official-artwork']?.front_default ?? null,
    types: raw.types.map((entry) => entry.type.name),
    baseStatTotal: stats.reduce((total, stat) => total + stat.value, 0),
    // La PokéAPI usa decímetros y hectogramos. Se convierte aquí para que el
    // frontend pinte el valor tal cual, sin tener que saber nada de esto.
    height: raw.height / 10,
    weight: raw.weight / 10,
    abilities: raw.abilities.map((entry) => entry.ability.name),
    stats,
  };
}

/** Recorta un detalle a lo que necesita una tarjeta del listado. */
function toSummary(detail: PokemonDetail): PokemonSummary {
  return {
    pokemonId: detail.pokemonId,
    name: detail.name,
    spriteUrl: detail.spriteUrl,
    types: detail.types,
    baseStatTotal: detail.baseStatTotal,
  };
}

function getIndex(): Promise<IndexEntry[]> {
  return indexCache.remember('index', async () => {
    const raw = await fetchFromPokeApi<{ results: RawNamedResource[] }>('/pokemon?limit=100000');

    return raw.results
      .map((entry) => ({ pokemonId: pokemonIdFromUrl(entry.url), name: entry.name }))
      .filter((entry) => Number.isFinite(entry.pokemonId) && entry.pokemonId < MAX_BASE_POKEMON_ID);
  });
}

export function getPokemonDetail(idOrName: number | string): Promise<PokemonDetail> {
  const key = String(idOrName).toLowerCase();

  return detailCache.remember(key, async () => {
    const raw = await fetchFromPokeApi<RawPokemon>(`/pokemon/${encodeURIComponent(key)}`);
    return toDetail(raw);
  });
}

export function getPokemonSummary(idOrName: number | string): Promise<PokemonSummary> {
  return getPokemonDetail(idOrName).then(toSummary);
}

/** Los tipos que existen, para el desplegable de filtros. */
export function getTypeNames(): Promise<string[]> {
  return typeNamesCache.remember('types', async () => {
    const raw = await fetchFromPokeApi<{ results: RawNamedResource[] }>('/type?limit=100');

    // Existen en la PokéAPI pero ningún Pokémon del juego principal los tiene:
    // `unknown` y `stellar` son internos y `shadow` viene de los spin-off. En el
    // desplegable serían filtros que no devuelven nada.
    return raw.results
      .map((entry) => entry.name)
      .filter((name) => !TIPOS_SIN_POKEMON.has(name))
      .sort();
  });
}

/** Ids de los Pokémon de un tipo. Se guarda como Set porque solo se usa para buscar. */
function getTypeMembers(type: string): Promise<Set<number>> {
  return typeMembersCache.remember(type, async () => {
    const raw = await fetchFromPokeApi<{ pokemon: Array<{ pokemon: RawNamedResource }> }>(
      `/type/${encodeURIComponent(type)}`,
    );

    return new Set(raw.pokemon.map((entry) => pokemonIdFromUrl(entry.pokemon.url)));
  });
}

export async function listPokemon(query: PokemonQuery): Promise<PokemonListResult> {
  const index = await getIndex();

  // Primero se filtra en memoria, que es gratis, y solo después se piden detalles.
  // Así una página cuesta como mucho `pageSize` peticiones en vez de miles.
  let candidates = index;

  if (query.search) {
    candidates = candidates.filter((entry) => entry.name.includes(query.search!));
  }

  if (query.type) {
    const members = await getTypeMembers(query.type);
    candidates = candidates.filter((entry) => members.has(entry.pokemonId));
  }

  const total = candidates.length;
  const offset = (query.page - 1) * query.pageSize;
  const pageEntries = candidates.slice(offset, offset + query.pageSize);

  // En paralelo: en serie estas 24 peticiones tardarían segundos. A partir de la
  // segunda visita salen todas de la caché y ni se llega a pedir nada.
  const details = await Promise.all(
    pageEntries.map((entry) => getPokemonDetail(entry.pokemonId)),
  );

  return {
    items: details.map(toSummary),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}
