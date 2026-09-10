import type { CollectionEntry as DbEntry, Prisma } from '@prisma/client';

import type { CollectionEntry } from '@pokedex/shared';

import { prisma } from '../lib/prisma.js';

// El único módulo que sabe cómo se guarda la colección, y también el único que
// carga con el detalle feo: SQLite no tiene columnas de tipo array, así que la
// lista de tipos viaja serializada como JSON en una columna de texto. Fuera de
// aquí, `types` es un `string[]` normal y corriente.

function serializeTypes(types: string[]): string {
  return JSON.stringify(types);
}

function parseTypes(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    // Una fila corrupta no puede tumbar el listado entero.
    return [];
  }
}

/** De fila de base de datos al objeto que consume el frontend. */
function toDomain(row: DbEntry): CollectionEntry {
  return {
    id: row.id,
    pokemonId: row.pokemonId,
    name: row.pokemonName,
    spriteUrl: row.spriteUrl,
    types: parseTypes(row.types),
    baseStatTotal: row.baseStatTotal,
    nickname: row.nickname,
    notes: row.notes,
    favorite: row.favorite,
    caughtAt: row.caughtAt.toISOString(),
  };
}

export async function listEntries(
  userId: string,
  orderBy: Prisma.CollectionEntryOrderByWithRelationInput,
): Promise<CollectionEntry[]> {
  const rows = await prisma.collectionEntry.findMany({ where: { userId }, orderBy });
  return rows.map(toDomain);
}

export async function findEntryById(userId: string, id: string): Promise<CollectionEntry | null> {
  // El `userId` va dentro del `where` y no en un `if` posterior. Así no hay forma
  // de leer por descuido la entrada de otro usuario.
  const row = await prisma.collectionEntry.findFirst({ where: { id, userId } });
  return row ? toDomain(row) : null;
}

export async function findEntryByPokemonId(
  userId: string,
  pokemonId: number,
): Promise<CollectionEntry | null> {
  const row = await prisma.collectionEntry.findUnique({
    where: { userId_pokemonId: { userId, pokemonId } },
  });
  return row ? toDomain(row) : null;
}

export async function createEntry(data: {
  userId: string;
  pokemonId: number;
  pokemonName: string;
  spriteUrl: string | null;
  types: string[];
  baseStatTotal: number;
  nickname?: string | null;
  notes?: string | null;
  favorite?: boolean;
}): Promise<CollectionEntry> {
  const row = await prisma.collectionEntry.create({
    data: { ...data, types: serializeTypes(data.types) },
  });
  return toDomain(row);
}

export async function updateEntry(
  userId: string,
  id: string,
  data: { nickname?: string | null; notes?: string | null; favorite?: boolean },
): Promise<CollectionEntry> {
  const row = await prisma.collectionEntry.update({ where: { id, userId }, data });
  return toDomain(row);
}

export function deleteEntry(userId: string, id: string): Promise<{ count: number }> {
  return prisma.collectionEntry.deleteMany({ where: { id, userId } });
}
