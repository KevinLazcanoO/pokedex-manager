import type { RequestHandler } from 'express';

import type { CollectionQuery, CreateEntryInput, UpdateEntryInput } from '@pokedex/shared';

import * as collection from '../services/collection.service.js';

// El router entero pasa antes por `requireAuth`, de ahí que `req.user` siempre esté.

export const listCollectionHandler: RequestHandler = async (req, res) => {
  const entries = await collection.listCollection(
    req.user!.id,
    req.query as unknown as CollectionQuery,
  );
  res.json(entries);
};

export const statsHandler: RequestHandler = async (req, res) => {
  const stats = await collection.getCollectionStats(req.user!.id);
  res.json(stats);
};

export const addHandler: RequestHandler = async (req, res) => {
  const entry = await collection.addToCollection(req.user!.id, req.body as CreateEntryInput);
  res.status(201).json(entry);
};

// El genérico de `RequestHandler` describe los parámetros de la ruta; con eso
// `req.params.id` queda tipado como `string` y no hacen falta castings.
export const updateHandler: RequestHandler<{ id: string }> = async (req, res) => {
  const entry = await collection.updateCollectionEntry(
    req.user!.id,
    req.params.id,
    req.body as UpdateEntryInput,
  );
  res.json(entry);
};

export const removeHandler: RequestHandler<{ id: string }> = async (req, res) => {
  await collection.removeFromCollection(req.user!.id, req.params.id);
  res.status(204).end();
};
