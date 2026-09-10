import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import type { PokemonSummary } from '@pokedex/shared';

// La PokéAPI se sustituye por un doble. Los tests tienen que poder correr sin red
// y dar siempre lo mismo; lo que se prueba aquí es nuestra lógica, no la suya.
vi.mock('../services/pokeapi.service.js', () => ({
  getPokemonSummary: vi.fn(),
}));

const { createApp } = await import('../app.js');
const { getPokemonSummary } = await import('../services/pokeapi.service.js');
const { crearUsuarioAutenticado } = await import('./helpers.js');

const app = createApp();

const BULBASAUR: PokemonSummary = {
  pokemonId: 1,
  name: 'bulbasaur',
  spriteUrl: 'https://example.com/1.png',
  types: ['grass', 'poison'],
  baseStatTotal: 318,
};

const CHARIZARD: PokemonSummary = {
  pokemonId: 6,
  name: 'charizard',
  spriteUrl: 'https://example.com/6.png',
  types: ['fire', 'flying'],
  baseStatTotal: 534,
};

const POKEMON_POR_ID = new Map([
  [BULBASAUR.pokemonId, BULBASAUR],
  [CHARIZARD.pokemonId, CHARIZARD],
]);

beforeEach(() => {
  vi.mocked(getPokemonSummary).mockImplementation(async (idOrName) => {
    const pokemon = POKEMON_POR_ID.get(Number(idOrName));
    if (!pokemon) throw new Error(`Pokemon no preparado en el test: ${idOrName}`);
    return pokemon;
  });
});

describe('proteccion de la coleccion', () => {
  it('responde 401 en todas las rutas sin sesion', async () => {
    const rutas = [
      request(app).get('/api/collection'),
      request(app).get('/api/collection/stats'),
      request(app).post('/api/collection').send({ pokemonId: 1 }),
      request(app).patch('/api/collection/cualquiera').send({ favorite: true }),
      request(app).delete('/api/collection/cualquiera'),
    ];

    for (const respuesta of await Promise.all(rutas)) {
      expect(respuesta.status).toBe(401);
    }
  });
});

describe('POST /api/collection', () => {
  it('captura un Pokemon copiando sus datos de la PokeAPI', async () => {
    const agent = await crearUsuarioAutenticado(app);

    const res = await agent.post('/api/collection').send({ pokemonId: 1, nickname: 'Bulbi' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      pokemonId: 1,
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      baseStatTotal: 318,
      nickname: 'Bulbi',
      favorite: false,
    });
  });

  it('impide capturar dos veces el mismo Pokemon', async () => {
    const agent = await crearUsuarioAutenticado(app);
    await agent.post('/api/collection').send({ pokemonId: 1 });

    const res = await agent.post('/api/collection').send({ pokemonId: 1 });

    expect(res.status).toBe(409);
  });

  it('rechaza un id invalido antes de llamar a la PokeAPI', async () => {
    const agent = await crearUsuarioAutenticado(app);

    const res = await agent.post('/api/collection').send({ pokemonId: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('pokemonId');
    expect(getPokemonSummary).not.toHaveBeenCalled();
  });
});

describe('GET /api/collection', () => {
  it('filtra por texto, por tipo y por favoritos', async () => {
    const agent = await crearUsuarioAutenticado(app);
    await agent.post('/api/collection').send({ pokemonId: 1, nickname: 'Bulbi' });
    await agent.post('/api/collection').send({ pokemonId: 6, favorite: true });

    const porTexto = await agent.get('/api/collection').query({ search: 'bulbi' });
    const porTipo = await agent.get('/api/collection').query({ type: 'fire' });
    const soloFavoritos = await agent.get('/api/collection').query({ favorite: 'true' });

    expect(porTexto.body.map((e: { pokemonId: number }) => e.pokemonId)).toEqual([1]);
    expect(porTipo.body.map((e: { pokemonId: number }) => e.pokemonId)).toEqual([6]);
    expect(soloFavoritos.body.map((e: { pokemonId: number }) => e.pokemonId)).toEqual([6]);
  });

  it('ordena por nombre cuando se pide', async () => {
    const agent = await crearUsuarioAutenticado(app);
    await agent.post('/api/collection').send({ pokemonId: 6 });
    await agent.post('/api/collection').send({ pokemonId: 1 });

    const res = await agent.get('/api/collection').query({ sort: 'name' });

    expect(res.body.map((e: { name: string }) => e.name)).toEqual(['bulbasaur', 'charizard']);
  });

  it('ordena por el apodo cuando lo hay, que es lo que ve el usuario', async () => {
    const agent = await crearUsuarioAutenticado(app);
    // Charizard lleva un apodo que empieza por "A", así que va primero aunque su
    // nombre de especie vaya después de "bulbasaur".
    await agent.post('/api/collection').send({ pokemonId: 6, nickname: 'Ala de fuego' });
    await agent.post('/api/collection').send({ pokemonId: 1 });

    const res = await agent.get('/api/collection').query({ sort: 'name' });

    expect(res.body.map((e: { nickname: string | null; name: string }) => e.nickname ?? e.name)).toEqual([
      'Ala de fuego',
      'bulbasaur',
    ]);
  });

  it('nunca muestra la coleccion de otro usuario', async () => {
    const ash = await crearUsuarioAutenticado(app);
    const gary = await crearUsuarioAutenticado(app);
    await ash.post('/api/collection').send({ pokemonId: 1 });

    const res = await gary.get('/api/collection');

    expect(res.body).toEqual([]);
  });
});

describe('PATCH y DELETE /api/collection/:id', () => {
  it('actualiza el apodo y el favorito', async () => {
    const agent = await crearUsuarioAutenticado(app);
    const creada = await agent.post('/api/collection').send({ pokemonId: 1 });

    const res = await agent
      .patch(`/api/collection/${creada.body.id}`)
      .send({ nickname: 'Bulbi', favorite: true });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nickname: 'Bulbi', favorite: true });
  });

  it('rechaza un PATCH sin ningun campo', async () => {
    const agent = await crearUsuarioAutenticado(app);
    const creada = await agent.post('/api/collection').send({ pokemonId: 1 });

    const res = await agent.patch(`/api/collection/${creada.body.id}`).send({});

    expect(res.status).toBe(400);
  });

  it('elimina la entrada', async () => {
    const agent = await crearUsuarioAutenticado(app);
    const creada = await agent.post('/api/collection').send({ pokemonId: 1 });

    const borrado = await agent.delete(`/api/collection/${creada.body.id}`);
    const listado = await agent.get('/api/collection');

    expect(borrado.status).toBe(204);
    expect(listado.body).toEqual([]);
  });

  it('no deja que un usuario edite ni borre la entrada de otro', async () => {
    const ash = await crearUsuarioAutenticado(app);
    const gary = await crearUsuarioAutenticado(app);
    const deAsh = await ash.post('/api/collection').send({ pokemonId: 1 });

    const intentoEditar = await gary
      .patch(`/api/collection/${deAsh.body.id}`)
      .send({ favorite: true });
    const intentoBorrar = await gary.delete(`/api/collection/${deAsh.body.id}`);

    // 404 y no 403, a propósito: para Gary esa entrada no existe. Con un 403 se
    // podría usar la API para averiguar qué ids tienen los demás.
    expect(intentoEditar.status).toBe(404);
    expect(intentoBorrar.status).toBe(404);
  });
});

describe('GET /api/collection/stats', () => {
  it('devuelve ceros con la coleccion vacia', async () => {
    const agent = await crearUsuarioAutenticado(app);

    const res = await agent.get('/api/collection/stats');

    expect(res.body).toMatchObject({ total: 0, favorites: 0, uniqueTypes: 0, byType: [] });
    expect(res.body.strongest).toBeNull();
    expect(res.body.latest).toBeNull();
  });

  it('resume totales, tipos y el Pokemon mas fuerte', async () => {
    const agent = await crearUsuarioAutenticado(app);
    await agent.post('/api/collection').send({ pokemonId: 1 });
    await agent.post('/api/collection').send({ pokemonId: 6, favorite: true });

    const res = await agent.get('/api/collection/stats');

    expect(res.body).toMatchObject({ total: 2, favorites: 1, uniqueTypes: 4 });
    expect(res.body.strongest.name).toBe('charizard');
    expect(res.body.latest.name).toBe('charizard');
    expect(res.body.byType).toHaveLength(4);
  });

  it('incluye el apodo del destacado, para que el panel muestre el mismo nombre que la tarjeta', async () => {
    const agent = await crearUsuarioAutenticado(app);
    await agent.post('/api/collection').send({ pokemonId: 6, nickname: 'Ala de fuego' });

    const res = await agent.get('/api/collection/stats');

    expect(res.body.strongest).toMatchObject({ name: 'charizard', nickname: 'Ala de fuego' });
  });
});
