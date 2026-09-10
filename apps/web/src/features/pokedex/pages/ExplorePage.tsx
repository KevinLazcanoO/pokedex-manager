import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { POKEMON_PAGE_SIZE } from '@pokedex/shared';

import { Alert } from '../../../components/ui/Alert';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { Spinner } from '../../../components/ui/Spinner';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useAddToCollection, useCapturedIds } from '../../collection/queries';
import { Filters } from '../components/Filters';
import { PokemonGrid } from '../components/PokemonGrid';
import { usePokemonList, usePokemonTypes } from '../queries';
import styles from './ExplorePage.module.css';

export function ExplorePage() {
  /**
   * Los filtros viven en la URL, no en un `useState`.
   *
   * Con eso una búsqueda se puede compartir o guardar en marcadores, el botón de
   * atrás hace lo que la gente espera y recargar no pierde lo que estabas viendo.
   * La URL es el estado; el componente se limita a leerla.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const busqueda = searchParams.get('buscar') ?? '';
  const tipo = searchParams.get('tipo') ?? '';
  const pagina = Number(searchParams.get('pagina') ?? '1');

  // El retardo va en la consulta y no en la URL: el campo responde al instante y
  // lo único que espera a que dejes de escribir es la petición.
  const busquedaConRetraso = useDebouncedValue(busqueda, 350);

  const [capturandoId, setCapturandoId] = useState<number | null>(null);

  const listado = usePokemonList({
    search: busquedaConRetraso || undefined,
    type: tipo || undefined,
    page: pagina,
    pageSize: POKEMON_PAGE_SIZE,
  });
  const { data: tipos = [] } = usePokemonTypes();
  const { data: capturados = new Set<number>() } = useCapturedIds();
  const capturar = useAddToCollection();

  function actualizarFiltros(cambios: Record<string, string>, reiniciarPagina = true) {
    setSearchParams(
      (previos) => {
        const siguientes = new URLSearchParams(previos);
        for (const [clave, valor] of Object.entries(cambios)) {
          if (valor === '') siguientes.delete(clave);
          else siguientes.set(clave, valor);
        }
        // Cambiar un filtro y quedarse en la página 7 suele dejar la pantalla
        // vacía, así que se vuelve a la primera.
        if (reiniciarPagina) siguientes.delete('pagina');
        return siguientes;
      },
      // Con `replace` el historial no se llena con una entrada por cada letra.
      { replace: true },
    );
  }

  async function manejarCaptura(pokemonId: number) {
    setCapturandoId(pokemonId);
    try {
      await capturar.mutateAsync({ pokemonId });
    } finally {
      setCapturandoId(null);
    }
  }

  return (
    <>
      <header className={styles.encabezado}>
        <h1 className={styles.titulo}>Explorar</h1>
        <p className={styles.subtitulo}>Busca Pokémon y añádelos a tu colección.</p>
      </header>

      <Filters
        busqueda={busqueda}
        tipo={tipo}
        tipos={tipos}
        onBusquedaChange={(valor) => actualizarFiltros({ buscar: valor })}
        onTipoChange={(valor) => actualizarFiltros({ tipo: valor })}
        onLimpiar={() => actualizarFiltros({ buscar: '', tipo: '' })}
      />

      {capturar.isError && <Alert>{capturar.error.message}</Alert>}

      {listado.isPending && <Spinner mensaje="Cargando Pokémon..." />}

      {listado.isError && <Alert>{listado.error.message}</Alert>}

      {listado.data &&
        (listado.data.items.length === 0 ? (
          <EmptyState
            titulo="Ningún Pokémon coincide"
            texto="Prueba con otro nombre o quita el filtro de tipo."
          />
        ) : (
          <>
            {/* Encabezado de verdad y no un párrafo: sin él, el índice del
                documento saltaba del h1 de la página a los h3 de las tarjetas y
                quien navega por encabezados se quedaba sin entrada a los
                resultados. */}
            <h2 className={styles.resumen}>{listado.data.total} Pokémon encontrados</h2>

            <div className={listado.isFetching ? styles.actualizando : undefined}>
              <PokemonGrid
                pokemon={listado.data.items}
                capturados={capturados}
                capturandoId={capturandoId}
                onCapturar={(id) => void manejarCaptura(id)}
              />
            </div>

            <Pagination
              pagina={listado.data.page}
              totalPaginas={listado.data.totalPages}
              onCambiar={(nueva) => {
                actualizarFiltros({ pagina: String(nueva) }, false);
                // Cambiar de página sin subir deja al usuario mirando el final de
                // una lista que acaba de cambiar entera.
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        ))}
    </>
  );
}
