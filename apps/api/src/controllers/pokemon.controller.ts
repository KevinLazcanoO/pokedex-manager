import type { RequestHandler } from 'express';

import type { PokemonQuery } from '@pokedex/shared';

import * as pokeapi from '../services/pokeapi.service.js';

export const listPokemonHandler: RequestHandler = async (req, res) => {
  const result = await pokeapi.listPokemon(req.query as unknown as PokemonQuery);
  res.json(result);
};

export const listTypesHandler: RequestHandler = async (_req, res) => {
  const types = await pokeapi.getTypeNames();
  res.json(types);
};

// El genérico de `RequestHandler` describe los parámetros de la ruta; con eso
// `req.params.idOrName` queda tipado como `string` y no hacen falta castings.
export const getPokemonHandler: RequestHandler<{ idOrName: string }> = async (req, res) => {
  const detail = await pokeapi.getPokemonDetail(req.params.idOrName);
  res.json(detail);
};
