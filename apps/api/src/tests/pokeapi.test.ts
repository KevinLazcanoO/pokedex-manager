import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests del servicio que habla con la PokéAPI.
 *
 * `fetch` va sustituido por un doble: los tests no pueden depender de internet, ni
 * castigar a un servicio público y gratuito cada vez que alguien los ejecuta.
 */

const RESPUESTAS_CRUDAS: Record<string, unknown> = {
  '/pokemon?limit=100000': {
    results: [
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
      { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' },
      // Forma alternativa: el servicio la descarta por tener un id >= 10000.
      { name: 'charizard-mega-x', url: 'https://pokeapi.co/api/v2/pokemon/10034/' },
    ],
  },
  '/type?limit=100': {
    results: [
      { name: 'fire', url: 'https://pokeapi.co/api/v2/type/10/' },
      { name: 'grass', url: 'https://pokeapi.co/api/v2/type/12/' },
      // No los usa ningún Pokémon del juego principal, así que deben filtrarse.
      { name: 'unknown', url: 'https://pokeapi.co/api/v2/type/10001/' },
      { name: 'shadow', url: 'https://pokeapi.co/api/v2/type/10002/' },
    ],
  },
  '/type/fire': {
    pokemon: [
      { pokemon: { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' } },
      { pokemon: { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' } },
    ],
  },
};

function pokemonCrudo(id: number, name: string) {
  return {
    id,
    name,
    height: 17, // decímetros -> el servicio debe devolver 1.7 metros
    weight: 905, // hectogramos -> el servicio debe devolver 90.5 kilos
    sprites: {
      front_default: `https://example.com/${id}.png`,
      other: { 'official-artwork': { front_default: `https://example.com/art/${id}.png` } },
    },
    types: [{ type: { name: 'fire', url: '' } }, { type: { name: 'flying', url: '' } }],
    abilities: [{ ability: { name: 'blaze', url: '' } }],
    stats: [
      { base_stat: 78, stat: { name: 'hp', url: '' } },
      { base_stat: 84, stat: { name: 'attack', url: '' } },
    ],
  };
}

for (const [id, name] of [
  [1, 'bulbasaur'],
  [4, 'charmander'],
  [6, 'charizard'],
] as const) {
  RESPUESTAS_CRUDAS[`/pokemon/${id}`] = pokemonCrudo(id, name);
  RESPUESTAS_CRUDAS[`/pokemon/${name}`] = pokemonCrudo(id, name);
}

const fetchFalso = vi.fn(async (url: string | URL) => {
  const path = String(url).replace('https://pokeapi.co/api/v2', '');
  const body = RESPUESTAS_CRUDAS[path];

  if (!body) return new Response('Not Found', { status: 404 });
  return new Response(JSON.stringify(body), { status: 200 });
});

/**
 * Las cachés viven en el módulo, así que cada test lo carga de cero. De paso, eso
 * deja comprobar el comportamiento de la caché sin trucos raros.
 */
async function cargarServicio() {
  vi.resetModules();
  return import('../services/pokeapi.service.js');
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchFalso);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getPokemonDetail', () => {
  it('normaliza las unidades y suma las estadisticas base', async () => {
    const { getPokemonDetail } = await cargarServicio();

    const detalle = await getPokemonDetail(6);

    expect(detalle).toMatchObject({
      pokemonId: 6,
      name: 'charizard',
      height: 1.7,
      weight: 90.5,
      types: ['fire', 'flying'],
      abilities: ['blaze'],
      baseStatTotal: 162,
      artworkUrl: 'https://example.com/art/6.png',
    });
  });

  it('traduce un 404 de la PokeAPI en un error 404 propio', async () => {
    const { getPokemonDetail } = await cargarServicio();

    await expect(getPokemonDetail('missingno')).rejects.toMatchObject({ status: 404 });
  });

  it('devuelve un 502 cuando la PokeAPI no responde', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('ECONNREFUSED');
    });
    const { getPokemonDetail } = await cargarServicio();

    await expect(getPokemonDetail(1)).rejects.toMatchObject({ status: 502 });
  });

  it('cachea: pedir dos veces el mismo Pokemon hace una sola peticion', async () => {
    const { getPokemonDetail } = await cargarServicio();

    await getPokemonDetail(6);
    await getPokemonDetail(6);

    const peticionesDelDetalle = fetchFalso.mock.calls.filter((call) =>
      String(call[0]).endsWith('/pokemon/6'),
    );
    expect(peticionesDelDetalle).toHaveLength(1);
  });

  it('agrupa las peticiones simultaneas del mismo Pokemon en una sola', async () => {
    const { getPokemonDetail } = await cargarServicio();

    await Promise.all([getPokemonDetail(6), getPokemonDetail(6), getPokemonDetail(6)]);

    const peticionesDelDetalle = fetchFalso.mock.calls.filter((call) =>
      String(call[0]).endsWith('/pokemon/6'),
    );
    expect(peticionesDelDetalle).toHaveLength(1);
  });
});

describe('listPokemon', () => {
  const consulta = { search: undefined, type: undefined, page: 1, pageSize: 24 };

  it('descarta las formas alternativas del indice', async () => {
    const { listPokemon } = await cargarServicio();

    const resultado = await listPokemon(consulta);

    expect(resultado.total).toBe(3);
    expect(resultado.items.map((item) => item.name)).not.toContain('charizard-mega-x');
  });

  it('busca por texto dentro del nombre', async () => {
    const { listPokemon } = await cargarServicio();

    const resultado = await listPokemon({ ...consulta, search: 'char' });

    expect(resultado.items.map((item) => item.name)).toEqual(['charmander', 'charizard']);
  });

  it('filtra por tipo', async () => {
    const { listPokemon } = await cargarServicio();

    const resultado = await listPokemon({ ...consulta, type: 'fire' });

    expect(resultado.items.map((item) => item.pokemonId)).toEqual([4, 6]);
  });

  it('pagina y calcula el total de paginas', async () => {
    const { listPokemon } = await cargarServicio();

    const pagina2 = await listPokemon({ ...consulta, pageSize: 2, page: 2 });

    expect(pagina2).toMatchObject({ total: 3, page: 2, pageSize: 2, totalPages: 2 });
    expect(pagina2.items).toHaveLength(1);
  });
});

describe('getTypeNames', () => {
  it('devuelve los tipos ordenados y sin los que ningun Pokemon usa', async () => {
    const { getTypeNames } = await cargarServicio();

    const tipos = await getTypeNames();

    expect(tipos).toEqual(['fire', 'grass']);
  });
});
