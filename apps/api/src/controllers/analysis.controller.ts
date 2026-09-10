import type { RequestHandler } from 'express';

import * as analysis from '../services/analysis.service.js';

export const statusHandler: RequestHandler = (req, res) => {
  res.json(analysis.estadoDelAnalisis(req.user!.id));
};

export const analyzeHandler: RequestHandler = async (req, res) => {
  const resultado = await analysis.analizarColeccion(req.user!.id);
  res.json(resultado);
};
