import { Link, useParams } from 'react-router-dom';
import { mdiArrowLeft, mdiCheckCircle, mdiPokeball } from '@mdi/js';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { Spinner } from '../../../components/ui/Spinner';
import { TypeBadge } from '../../../components/ui/TypeBadge';
import { useAddToCollection, useCapturedIds } from '../../collection/queries';
import { StatBars } from '../components/StatBars';
import { usePokemonDetail } from '../queries';
import styles from './PokemonDetailPage.module.css';

/** La PokéAPI da los nombres con guiones: "cursed-body". */
function conEspacios(nombre: string): string {
  return nombre.replace(/-/g, ' ');
}

export function PokemonDetailPage() {
  // La ruta es `/pokemon/:idOrName`, el parámetro siempre viene.
  const { idOrName = '' } = useParams();

  const { data: pokemon, isPending, isError, error } = usePokemonDetail(idOrName);
  const { data: capturados = new Set<number>() } = useCapturedIds();
  const capturar = useAddToCollection();

  if (isPending) return <Spinner mensaje="Cargando Pokémon..." />;
  if (isError) return <Alert>{error.message}</Alert>;

  const yaCapturado = capturados.has(pokemon.pokemonId);

  return (
    <>
      <Link className={styles.volver} to="/explorar">
        <Icon path={mdiArrowLeft} />
        Volver a explorar
      </Link>

      <article className={styles.tarjeta}>
        <div className={styles.retrato}>
          {/* Se prefiere el arte oficial, que es más grande y nítido. Si no lo hay
              se cae al sprite pequeño antes que dejar un hueco. */}
          {(pokemon.artworkUrl ?? pokemon.spriteUrl) && (
            <img
              className={styles.artwork}
              src={pokemon.artworkUrl ?? pokemon.spriteUrl ?? ''}
              alt={`Ilustracion de ${pokemon.name}`}
            />
          )}

          <div className={styles.acciones}>
            {yaCapturado ? (
              <p className={styles.capturado}>
                <Icon path={mdiCheckCircle} />
                Ya está en tu colección
              </p>
            ) : (
              <Button
                cargando={capturar.isPending}
                onClick={() => capturar.mutate({ pokemonId: pokemon.pokemonId })}
              >
                <Icon path={mdiPokeball} />
                {capturar.isPending ? 'Capturando...' : 'Capturar'}
              </Button>
            )}
          </div>
        </div>

        <div>
          <p className={styles.numero}>#{String(pokemon.pokemonId).padStart(3, '0')}</p>
          <h1 className={styles.nombre}>{pokemon.name}</h1>

          <div className={styles.tipos}>
            {pokemon.types.map((tipo) => (
              <TypeBadge key={tipo} tipo={tipo} />
            ))}
          </div>

          {capturar.isError && <Alert>{capturar.error.message}</Alert>}

          <dl className={styles.datos}>
            <div className={styles.dato}>
              <dt>Altura</dt>
              <dd>{pokemon.height} m</dd>
            </div>
            <div className={styles.dato}>
              <dt>Peso</dt>
              <dd>{pokemon.weight} kg</dd>
            </div>
            <div className={styles.dato}>
              <dt>Total base</dt>
              <dd>{pokemon.baseStatTotal}</dd>
            </div>
            <div className={styles.dato}>
              <dt>Habilidades</dt>
              <dd className={styles.capitalizado}>
                {pokemon.abilities.map(conEspacios).join(', ')}
              </dd>
            </div>
          </dl>

          <section className={styles.seccion}>
            <h2 className={styles.tituloSeccion}>Estadísticas base</h2>
            <StatBars stats={pokemon.stats} />
          </section>
        </div>
      </article>
    </>
  );
}
