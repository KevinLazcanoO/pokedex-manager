import type {
  CollectionEntry,
  CollectionHighlight,
  CollectionQuery,
  CollectionStats,
  CreateEntryInput,
  UpdateEntryInput,
} from '@pokedex/shared';
import type { Prisma } from '@prisma/client';

import { conflict, notFound } from '../lib/errors.js';
import * as repo from '../repositories/collection.repository.js';
import { getPokemonSummary } from './pokeapi.service.js';

/** De la opción de orden de la interfaz a la cláusula que entiende Prisma. */
const ORDER_BY: Record<CollectionQuery['sort'], Prisma.CollectionEntryOrderByWithRelationInput> = {
  recent: { caughtAt: 'desc' },
  oldest: { caughtAt: 'asc' },
  name: { pokemonName: 'asc' },
  pokemonId: { pokemonId: 'asc' },
};

/** Lo que se lee en la tarjeta: el apodo si lo hay, y si no el nombre de especie. */
function nombreMostrado(entrada: CollectionEntry): string {
  return entrada.nickname?.trim() || entrada.name;
}

/**
 * Reordena por el nombre que se ve en pantalla.
 *
 * SQL solo puede ordenar por `pokemonName`, así que uno apodado "Psico" salía
 * colocado como "mewtwo" y la lista parecía desordenada. Se ordena por lo que el
 * usuario lee, que es algo que solo sabe la aplicación. `localeCompare` se encarga
 * de que las tildes y las mayúsculas se comparen como toca.
 */
function ordenarPorNombreMostrado(entradas: CollectionEntry[]): CollectionEntry[] {
  return [...entradas].sort((a, b) =>
    nombreMostrado(a).localeCompare(nombreMostrado(b), 'es', { sensitivity: 'base' }),
  );
}

/**
 * La búsqueda y el filtro por tipo se resuelven en memoria, no en SQL.
 *
 * El motivo, sin adornos: SQLite no compara texto ignorando mayúsculas fuera de
 * ASCII, y no sabe mirar dentro del JSON de `types`. Una colección personal tiene
 * decenas de entradas, así que filtrar aquí es correcto y bastante más legible.
 * Si algún día fueran miles, tocaría sacar `types` a su propia tabla y filtrar en
 * SQL; el cambio se quedaría entre este archivo y el repositorio.
 */
function applyFilters(entries: CollectionEntry[], query: CollectionQuery): CollectionEntry[] {
  let result = entries;

  if (query.search) {
    const needle = query.search.toLowerCase();
    result = result.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        (entry.nickname?.toLowerCase().includes(needle) ?? false),
    );
  }

  if (query.type) {
    const type = query.type.toLowerCase();
    result = result.filter((entry) => entry.types.includes(type));
  }

  if (query.favorite) {
    result = result.filter((entry) => entry.favorite);
  }

  return result;
}

export async function listCollection(
  userId: string,
  query: CollectionQuery,
): Promise<CollectionEntry[]> {
  const entries = await repo.listEntries(userId, ORDER_BY[query.sort]);
  const filtradas = applyFilters(entries, query);

  return query.sort === 'name' ? ordenarPorNombreMostrado(filtradas) : filtradas;
}

export async function addToCollection(
  userId: string,
  input: CreateEntryInput,
): Promise<CollectionEntry> {
  const existing = await repo.findEntryByPokemonId(userId, input.pokemonId);
  if (existing) {
    throw conflict('Ese Pokémon ya está en tu colección');
  }

  // Se pregunta a la PokéAPI al capturar y se copian los datos a la fila. Si el
  // Pokémon no existe, este mismo paso lanza un 404 y no se llega a guardar nada.
  const pokemon = await getPokemonSummary(input.pokemonId);

  return repo.createEntry({
    userId,
    pokemonId: pokemon.pokemonId,
    pokemonName: pokemon.name,
    spriteUrl: pokemon.spriteUrl,
    types: pokemon.types,
    baseStatTotal: pokemon.baseStatTotal,
    nickname: input.nickname ?? null,
    notes: input.notes ?? null,
    favorite: input.favorite ?? false,
  });
}

export async function updateCollectionEntry(
  userId: string,
  id: string,
  input: UpdateEntryInput,
): Promise<CollectionEntry> {
  const existing = await repo.findEntryById(userId, id);
  if (!existing) throw notFound('Esa entrada no está en tu colección');

  return repo.updateEntry(userId, id, input);
}

export async function removeFromCollection(userId: string, id: string): Promise<void> {
  const { count } = await repo.deleteEntry(userId, id);
  if (count === 0) throw notFound('Esa entrada no está en tu colección');
}

function toHighlight(entry: CollectionEntry): CollectionHighlight {
  return {
    pokemonId: entry.pokemonId,
    name: entry.name,
    spriteUrl: entry.spriteUrl,
    types: entry.types,
    baseStatTotal: entry.baseStatTotal,
    nickname: entry.nickname,
  };
}

/**
 * Resumen para el panel de estadísticas.
 *
 * Se calcula con las filas ya guardadas, sin tocar la PokéAPI: para eso se copia
 * `baseStatTotal` al capturar. Es también el punto natural del que colgaría un
 * análisis con IA más adelante.
 */
export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const entries = await repo.listEntries(userId, ORDER_BY.recent);

  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const type of entry.types) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }

  const byType = [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  const strongest = entries.reduce<CollectionEntry | null>(
    (best, entry) => (best === null || entry.baseStatTotal > best.baseStatTotal ? entry : best),
    null,
  );

  return {
    total: entries.length,
    favorites: entries.filter((entry) => entry.favorite).length,
    uniqueTypes: counts.size,
    byType,
    strongest: strongest && toHighlight(strongest),
    // `listEntries` viene ordenado por fecha descendente: el primero es el último
    // capturado.
    latest: entries[0] ? toHighlight(entries[0]) : null,
  };
}
