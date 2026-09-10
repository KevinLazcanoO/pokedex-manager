import { Router } from 'express';

import { loginSchema, registerSchema } from '@pokedex/shared';

import {
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../middleware/validate.js';

export const authRouter = Router();

authRouter.post('/register', validate('body', registerSchema), registerHandler);
authRouter.post('/login', validate('body', loginSchema), loginHandler);
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
