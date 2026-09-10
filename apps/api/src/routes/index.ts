import { Router } from 'express';

import { analysisRouter } from './analysis.routes.js';
import { authRouter } from './auth.routes.js';
import { collectionRouter } from './collection.routes.js';
import { pokemonRouter } from './pokemon.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/pokemon', pokemonRouter);
apiRouter.use('/collection', collectionRouter);
apiRouter.use('/analysis', analysisRouter);
