import { Router } from 'express';

import { analyzeHandler, statusHandler } from '../controllers/analysis.controller.js';
import { requireAuth } from '../middleware/require-auth.js';

export const analysisRouter = Router();

// Solo usuarios con sesión: la función gasta dinero de la clave de quien ejecuta
// el proyecto, así que no puede quedar abierta a cualquiera que llegue a la URL.
analysisRouter.use(requireAuth);

analysisRouter.get('/status', statusHandler);
// POST y no GET porque generar un análisis cuesta dinero: no es una lectura, y
// así tampoco lo dispara un navegador precargando enlaces.
analysisRouter.post('/', analyzeHandler);
