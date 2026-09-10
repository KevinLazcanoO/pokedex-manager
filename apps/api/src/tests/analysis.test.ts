import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PokemonSummary } from '@pokedex/shared';

/**
 * La API de Anthropic se sustituye por un doble. Un test no puede depender de una
 * clave, ni de la red, ni gastar dinero real cada vez que alguien lo ejecuta.
 */
const parseMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { parse: parseMock };
  },
}));

vi.mock('../services/pokeapi.service.js', () => ({ getPokemonSummary: vi.fn() }));

const RESPUESTA_IA = {
  summary: 'Tu colección tira a fuego y va corta de agua.',
  strengths: ['Buen núcleo de tipo fuego'],
  gaps: ['Ningún Pokémon de tipo agua'],
  recommendations: [{ name: 'blastoise', reason: 'Te cubre la debilidad al fuego' }],
};

/** El doble tiene que respetar el id pedido: si no, capturar otro Pokémon no
 *  cambiaría la colección y la caché escondería lo que se quiere probar. */
const POKEMON: Record<number, PokemonSummary> = {
  1: { pokemonId: 1, name: 'bulbasaur', spriteUrl: null, types: ['grass', 'poison'], baseStatTotal: 318 },
  4: { pokemonId: 4, name: 'charmander', spriteUrl: null, types: ['fire'], baseStatTotal: 309 },
};

/**
 * `analisisIaActivo` se calcula al cargar el módulo de configuración, así que cada
 * escenario necesita cargar la aplicación de cero con su propio entorno.
 */
async function cargarApp(entorno: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [clave, valor] of Object.entries(entorno)) {
    if (valor === undefined) delete process.env[clave];
    else process.env[clave] = valor;
  }

  const { createApp } = await import('../app.js');
  const { getPokemonSummary } = await import('../services/pokeapi.service.js');
  vi.mocked(getPokemonSummary).mockImplementation(async (idOrName) => {
    const pokemon = POKEMON[Number(idOrName)];
    if (!pokemon) throw new Error(`Pokémon no preparado en el test: ${idOrName}`);
    return pokemon;
  });

  return createApp();
}

beforeEach(() => {
  parseMock.mockResolvedValue({ parsed_output: RESPUESTA_IA });
});

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.AI_LIMITE_POR_USUARIO_AL_DIA;
  delete process.env.AI_LIMITE_GLOBAL_AL_DIA;
});

describe('sin ANTHROPIC_API_KEY configurada', () => {
  it('la función aparece como no disponible', async () => {
    const app = await cargarApp({ ANTHROPIC_API_KEY: undefined });
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: 'sinclave@example.com',
      password: 'pokedex2026',
      displayName: 'Sin clave',
    });

    const res = await agent.get('/api/analysis/status');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ available: false, remainingToday: null });
  });

  it('pedir un análisis no llama a la API externa', async () => {
    const app = await cargarApp({ ANTHROPIC_API_KEY: undefined });
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: 'sinclave2@example.com',
      password: 'pokedex2026',
      displayName: 'Sin clave',
    });
    await agent.post('/api/collection').send({ pokemonId: 1 });

    const res = await agent.post('/api/analysis');

    expect(res.status).toBe(404);
    expect(parseMock).not.toHaveBeenCalled();
  });
});

describe('protección del endpoint', () => {
  it('responde 401 sin sesión, aunque la función esté activa', async () => {
    const app = await cargarApp({ ANTHROPIC_API_KEY: 'sk-ant-de-prueba' });

    const estado = await request(app).get('/api/analysis/status');
    const analisis = await request(app).post('/api/analysis');

    expect(estado.status).toBe(401);
    expect(analisis.status).toBe(401);
    expect(parseMock).not.toHaveBeenCalled();
  });
});

describe('con la función activa', () => {
  async function agenteConColeccion(correo: string, entorno: Record<string, string> = {}) {
    const app = await cargarApp({ ANTHROPIC_API_KEY: 'sk-ant-de-prueba', ...entorno });
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: correo,
      password: 'pokedex2026',
      displayName: 'Entrenador',
    });
    await agent.post('/api/collection').send({ pokemonId: 1, nickname: 'Bulbi' });
    return agent;
  }

  it('devuelve el análisis con la forma esperada', async () => {
    const agent = await agenteConColeccion('activa1@example.com');

    const res = await agent.post('/api/analysis');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...RESPUESTA_IA, cached: false, model: 'claude-opus-5' });
    expect(res.body.generatedAt).toEqual(expect.any(String));
  });

  it('rechaza el análisis con la colección vacía, sin gastar una llamada', async () => {
    const app = await cargarApp({ ANTHROPIC_API_KEY: 'sk-ant-de-prueba' });
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: 'vacia@example.com',
      password: 'pokedex2026',
      displayName: 'Vacía',
    });

    const res = await agent.post('/api/analysis');

    expect(res.status).toBe(400);
    expect(parseMock).not.toHaveBeenCalled();
  });

  it('manda los datos del usuario como datos, avisando de que no son instrucciones', async () => {
    const agent = await agenteConColeccion('inyeccion@example.com');

    await agent.post('/api/analysis');

    const [peticion] = parseMock.mock.calls[0] as [{ system: string; messages: [{ content: string }] }];
    expect(peticion.messages[0].content).toContain('<coleccion>');
    expect(peticion.messages[0].content).toContain('Bulbi');
    expect(peticion.system).toMatch(/DATOS/);
    expect(peticion.system).toMatch(/instrucciones/i);
  });

  it('reutiliza el análisis guardado si la colección no ha cambiado', async () => {
    const agent = await agenteConColeccion('cache@example.com');

    const primera = await agent.post('/api/analysis');
    const segunda = await agent.post('/api/analysis');

    expect(primera.body.cached).toBe(false);
    expect(segunda.body.cached).toBe(true);
    // Lo importante: la segunda no ha costado una llamada a la API.
    expect(parseMock).toHaveBeenCalledTimes(1);
  });

  it('corta al llegar al límite diario del usuario', async () => {
    const agent = await agenteConColeccion('limite@example.com', {
      AI_LIMITE_POR_USUARIO_AL_DIA: '1',
    });

    await agent.post('/api/analysis');
    // Capturar otro cambia la colección, así que la caché ya no sirve y el
    // segundo análisis sí tendría que llamar a la API. El límite lo impide.
    await agent.post('/api/collection').send({ pokemonId: 4 });
    const segunda = await agent.post('/api/analysis');

    expect(segunda.status).toBe(429);
    expect(parseMock).toHaveBeenCalledTimes(1);
  });

  it('no descuenta el intento cuando la API falla, y no filtra el detalle', async () => {
    const agent = await agenteConColeccion('fallo@example.com', {
      AI_LIMITE_POR_USUARIO_AL_DIA: '2',
    });
    parseMock.mockRejectedValueOnce(new Error('401 x-api-key: sk-ant-secreto-de-verdad'));

    const fallida = await agent.post('/api/analysis');
    const estado = await agent.get('/api/analysis/status');

    expect(fallida.status).toBe(502);
    expect(JSON.stringify(fallida.body)).not.toContain('sk-ant');
    // El intento fallido no le ha gastado el cupo.
    expect(estado.body.remainingToday).toBe(2);
  });
});
