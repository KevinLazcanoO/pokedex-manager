import { Router } from 'express';

import { collectionQuerySchema, createEntrySchema, updateEntrySchema } from '@pokedex/shared';

import {
  addHandler,
  listCollectionHandler,
  removeHandler,
  statsHandler,
  updateHandler,
} from '../controllers/collection.controller.js';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../middleware/validate.js';

export const collectionRouter = Router();

// La colección entera es privada. Una línea protege todo el router; repetir
// `requireAuth` ruta por ruta acaba en que un día se te olvida en una.
collectionRouter.use(requireAuth);

collectionRouter.get('/', validate('query', collectionQuerySchema), listCollectionHandler);
collectionRouter.get('/stats', statsHandler);
collectionRouter.post('/', validate('body', createEntrySchema), addHandler);
collectionRouter.patch('/:id', validate('body', updateEntrySchema), updateHandler);
collectionRouter.delete('/:id', removeHandler);
