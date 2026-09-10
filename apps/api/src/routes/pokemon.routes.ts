import { Router } from 'express';

import { pokemonQuerySchema } from '@pokedex/shared';

import {
  getPokemonHandler,
  listPokemonHandler,
  listTypesHandler,
} from '../controllers/pokemon.controller.js';
import { validate } from '../middleware/validate.js';

export const pokemonRouter = Router();

pokemonRouter.get('/', validate('query', pokemonQuerySchema), listPokemonHandler);

// `/types` tiene que ir antes que `/:idOrName` o Express entenderá que "types"
// es el nombre de un Pokémon.
pokemonRouter.get('/types', listTypesHandler);
pokemonRouter.get('/:idOrName', getPokemonHandler);
