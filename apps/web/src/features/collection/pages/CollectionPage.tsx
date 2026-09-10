import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { CollectionEntry, CollectionSort } from '@pokedex/shared';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { AnalysisPanel } from '../../analysis/components/AnalysisPanel';
import { useAuth } from '../../auth/useAuth';
import { CollectionFilters } from '../components/CollectionFilters';
import { CollectionGrid } from '../components/CollectionGrid';
import { EditEntryDialog } from '../components/EditEntryDialog';
import { StatsPanel } from '../components/StatsPanel';
import {
  useCollection,
  useCollectionStats,
  useDeleteEntry,
  useToggleFavorite,
} from '../queries';
import styles from './CollectionPage.module.css';

export function CollectionPage() {
  const { user } = useAuth();

  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [orden, setOrden] = useState<CollectionSort>('recent');

  // La entrada que se está editando o borrando. `null` es diálogo cerrado.
  const [editando, setEditando] = useState<CollectionEntry | null>(null);
  const [borrando, setBorrando] = useState<CollectionEntry | null>(null);

  const busquedaConRetraso = useDebouncedValue(busqueda, 300);

  const stats = useCollectionStats();
  const listado = useCollection({
    search: busquedaConRetraso || undefined,
    type: tipo || undefined,
    favorite: soloFavoritos || undefined,
    sort: orden,
  });

  const alternarFavorito = useToggleFavorite();
  const eliminar = useDeleteEntry();

  /**
   * Los tipos del filtro salen de las estadísticas, que el servidor ya calcula, y
   * no de recorrer el listado. Si salieran del listado, las opciones cambiarían al
   * filtrar: eliges "fuego" y ves desaparecer todos los demás tipos.
   */
  const tiposDisponibles = useMemo(
    () => (stats.data?.byType ?? []).map((entrada) => entrada.type).sort(),
    [stats.data],
  );

  const hayFiltros = busqueda !== '' || tipo !== '' || soloFavoritos;
  const coleccionVacia = stats.data?.total === 0;

  async function confirmarBorrado() {
    if (!borrando) return;
    await eliminar.mutateAsync(borrando.id);
    setBorrando(null);
  }

  return (
    <>
      <header className={styles.encabezado}>
        <div>
          <h1 className={styles.titulo}>Hola, {user?.displayName}</h1>
          <p className={styles.subtitulo}>Este es el estado de tu colección.</p>
        </div>

        <Link to="/explorar">
          <Button>Capturar más</Button>
        </Link>
      </header>

      {stats.isPending && <Spinner mensaje="Cargando tu colección..." />}
      {stats.isError && <Alert>{stats.error.message}</Alert>}
      {stats.data && <StatsPanel stats={stats.data} />}

      {/* Con la colección vacía no se pintan filtros: no hay nada que filtrar. */}
      {coleccionVacia ? (
        <div className={styles.seccion}>
          <EmptyState
            titulo="Tu colección está vacía"
            texto="Busca Pokémon en el explorador y captura el primero."
            accion={
              <Link to="/explorar">
                <Button>Ir a explorar</Button>
              </Link>
            }
          />
        </div>
      ) : (
        stats.data && (
          <section className={styles.seccion}>
            <h2 className={styles.tituloSeccion}>Tus Pokémon</h2>

            <CollectionFilters
              busqueda={busqueda}
              tipo={tipo}
              soloFavoritos={soloFavoritos}
              orden={orden}
              tiposDisponibles={tiposDisponibles}
              onBusquedaChange={setBusqueda}
              onTipoChange={setTipo}
              onFavoritosChange={setSoloFavoritos}
              onOrdenChange={setOrden}
            />

            {alternarFavorito.isError && <Alert>{alternarFavorito.error.message}</Alert>}
            {eliminar.isError && <Alert>{eliminar.error.message}</Alert>}

            {listado.isPending && <Spinner />}
            {listado.isError && <Alert>{listado.error.message}</Alert>}

            {listado.data &&
              (listado.data.length === 0 ? (
                <EmptyState
                  titulo="Ningún Pokémon coincide"
                  texto={
                    hayFiltros
                      ? 'Prueba a cambiar la búsqueda o quitar los filtros.'
                      : 'Tu colección está vacía.'
                  }
                />
              ) : (
                <>
                  <p className={styles.resumen}>
                    {listado.data.length}{' '}
                    {listado.data.length === 1 ? 'Pokémon' : 'Pokémon'} en pantalla
                  </p>

                  <CollectionGrid
                    entradas={listado.data}
                    onEditar={setEditando}
                    onEliminar={setBorrando}
                    onAlternarFavorito={(entrada) =>
                      alternarFavorito.mutate({ id: entrada.id, favorite: !entrada.favorite })
                    }
                  />
                </>
              ))}
          </section>
        )
      )}

      {/* La `key` reinicia el formulario al cambiar de entrada, sin necesidad de
          un efecto que copie las props al estado. */}
      {stats.data && <AnalysisPanel coleccionVacia={stats.data.total === 0} />}

      <EditEntryDialog
        key={editando?.id ?? 'cerrado'}
        entrada={editando}
        onCerrar={() => setEditando(null)}
      />

      <ConfirmDialog
        abierto={borrando !== null}
        titulo="Eliminar de la colección"
        mensaje={`Vas a eliminar a ${borrando?.nickname ?? borrando?.name ?? ''} de tu colección. Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        confirmando={eliminar.isPending}
        onConfirmar={() => void confirmarBorrado()}
        onCancelar={() => setBorrando(null)}
      />
    </>
  );
}
