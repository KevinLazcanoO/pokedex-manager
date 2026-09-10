import { z } from 'zod';
import type { PokemonSummary } from './pokemon.js';

/** Un Pokémon "capturado" por el usuario, con sus datos personales encima. */
export interface CollectionEntry extends PokemonSummary {
  id: string;
  nickname: string | null;
  notes: string | null;
  favorite: boolean;
  caughtAt: string;
}

export const createEntrySchema = z.object({
  pokemonId: z.number().int().positive('Identificador de Pokémon inválido'),
  nickname: z.string().trim().max(30, 'El apodo no puede superar los 30 caracteres').optional(),
  notes: z.string().trim().max(500, 'Las notas no pueden superar los 500 caracteres').optional(),
  favorite: z.boolean().optional(),
});

// Al editar todo es opcional, pero el cuerpo no puede venir vacío: un PATCH sin
// cambios casi siempre es un fallo del cliente, no algo que queramos aceptar.
export const updateEntrySchema = z
  .object({
    nickname: z.string().trim().max(30, 'El apodo no puede superar los 30 caracteres').nullable(),
    notes: z.string().trim().max(500, 'Las notas no pueden superar los 500 caracteres').nullable(),
    favorite: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envía al menos un campo para actualizar',
  });

export const COLLECTION_SORT_OPTIONS = ['recent', 'oldest', 'name', 'pokemonId'] as const;
export type CollectionSort = (typeof COLLECTION_SORT_OPTIONS)[number];

export const collectionQuerySchema = z.object({
  search: z.string().trim().max(50).optional(),
  type: z.string().trim().max(20).optional(),
  favorite: z.coerce.boolean().optional(),
  sort: z.enum(COLLECTION_SORT_OPTIONS).default('recent'),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type CollectionQuery = z.infer<typeof collectionQuerySchema>;

// Pokémon destacado del panel de estadísticas. Lleva el apodo además del nombre
// de especie porque, si no, uno apodado aparecía con dos nombres distintos en la
// misma pantalla: "Psico" en su tarjeta y "mewtwo" en el panel.
export interface CollectionHighlight extends PokemonSummary {
  nickname: string | null;
}

/** Lo que alimenta el panel de estadísticas de la colección. */
export interface CollectionStats {
  total: number;
  favorites: number;
  uniqueTypes: number;
  byType: Array<{ type: string; count: number }>;
  strongest: CollectionHighlight | null;
  latest: CollectionHighlight | null;
}
