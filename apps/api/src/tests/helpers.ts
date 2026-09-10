import request from 'supertest';
import type { Express } from 'express';
import type TestAgent from 'supertest/lib/agent.js';

let contador = 0;

/**
 * Crea un usuario y devuelve un agente con su cookie de sesión ya puesta. Cada
 * llamada usa un correo distinto para que dos usuarios del mismo test no choquen.
 */
export async function crearUsuarioAutenticado(app: Express): Promise<TestAgent> {
  contador += 1;
  const agent = request.agent(app);

  await agent.post('/api/auth/register').send({
    email: `entrenador${contador}@example.com`,
    password: 'pokedex2026',
    displayName: `Entrenador ${contador}`,
  });

  return agent;
}
