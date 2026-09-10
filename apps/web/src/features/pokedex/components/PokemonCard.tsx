import { Link } from 'react-router-dom';
import { mdiCheckCircle, mdiPokeball } from '@mdi/js';

import type { PokemonSummary } from '@pokedex/shared';

import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { TypeBadge } from '../../../components/ui/TypeBadge';
import styles from './PokemonCard.module.css';

interface Props {
  pokemon: PokemonSummary;
  capturado: boolean;
  capturando: boolean;
  onCapturar: (pokemonId: number) => void;
}

/** El número de la Pokédex como #001, que es como se ve siempre. */
function numeroPokedex(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

export function PokemonCard({ pokemon, capturado, capturando, onCapturar }: Props) {
  return (
    <article className={styles.tarjeta}>
      {/* El enlace lleva dentro el nombre para que el navegador y los lectores de
          pantalla sepan a dónde va, aunque visualmente cubra la tarjeta entera. */}
      <Link className={styles.enlace} to={`/pokemon/${pokemon.pokemonId}`}>
        <span className="solo-lectores">Ver detalle de {pokemon.name}</span>
      </Link>

      <span className={styles.numero}>{numeroPokedex(pokemon.pokemonId)}</span>

      {pokemon.spriteUrl ? (
        <img
          className={styles.imagen}
          src={pokemon.spriteUrl}
          alt=""
          width={96}
          height={96}
          // Solo se descargan las imágenes que llegan a verse.
          loading="lazy"
        />
      ) : (
        <div className={`${styles.imagen} ${styles.sinImagen}`}>Sin imagen</div>
      )}

      <h3 className={styles.nombre}>{pokemon.name}</h3>

      <div className={styles.tipos}>
        {pokemon.types.map((tipo) => (
          <TypeBadge key={tipo} tipo={tipo} />
        ))}
      </div>

      <div className={styles.acciones}>
        {capturado ? (
          <p className={styles.capturado}>
            {/* "En tu colección" se partía en dos líneas en móvil y estiraba la
                tarjeta respecto a las de al lado, así que texto corto. */}
            <Icon path={mdiCheckCircle} />
            Capturado
          </p>
        ) : (
          <Button
            variante="secundario"
            anchoCompleto
            cargando={capturando}
            onClick={() => onCapturar(pokemon.pokemonId)}
          >
            <Icon path={mdiPokeball} />
            {capturando ? 'Capturando...' : 'Capturar'}
          </Button>
        )}
      </div>
    </article>
  );
}
