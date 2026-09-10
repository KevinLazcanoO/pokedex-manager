import { mdiDelete, mdiPencil, mdiStar, mdiStarOutline } from '@mdi/js';

import type { CollectionEntry } from '@pokedex/shared';

import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { TypeBadge } from '../../../components/ui/TypeBadge';
import styles from './CollectionCard.module.css';

interface Props {
  entrada: CollectionEntry;
  onEditar: (entrada: CollectionEntry) => void;
  onEliminar: (entrada: CollectionEntry) => void;
  onAlternarFavorito: (entrada: CollectionEntry) => void;
}

/** Fecha legible en español, sin meter una librería entera solo para esto. */
const formatoFecha = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function CollectionCard({ entrada, onEditar, onEliminar, onAlternarFavorito }: Props) {
  const tieneApodo = entrada.nickname !== null && entrada.nickname !== '';

  return (
    <article className={styles.tarjeta}>
      <div className={styles.superior}>
        <span className={styles.numero}>#{String(entrada.pokemonId).padStart(3, '0')}</span>

        <button
          type="button"
          className={`${styles.favorito} ${entrada.favorite ? styles.favoritoActivo : ''}`}
          onClick={() => onAlternarFavorito(entrada)}
          // `aria-pressed` le dice al lector de pantalla que esto es un interruptor
          // y en qué posición está, cosa que la estrella sola no cuenta.
          aria-pressed={entrada.favorite}
          aria-label={entrada.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        >
          <Icon path={entrada.favorite ? mdiStar : mdiStarOutline} size="1.4em" />
        </button>
      </div>

      <div className={styles.centro}>
        {entrada.spriteUrl && (
          <img
            className={styles.imagen}
            src={entrada.spriteUrl}
            alt=""
            width={88}
            height={88}
            loading="lazy"
          />
        )}

        <h3 className={styles.apodo}>{tieneApodo ? entrada.nickname : entrada.name}</h3>
        {/* El nombre real solo aparece si hay apodo; si no, sería repetirlo. */}
        {tieneApodo && <p className={styles.especie}>{entrada.name}</p>}

        <div className={styles.tipos}>
          {entrada.types.map((tipo) => (
            <TypeBadge key={tipo} tipo={tipo} />
          ))}
        </div>
      </div>

      {entrada.notes && <p className={styles.notas}>{entrada.notes}</p>}

      <p className={styles.fecha}>
        Capturado el {formatoFecha.format(new Date(entrada.caughtAt))}
      </p>

      <div className={styles.acciones}>
        <Button variante="secundario" onClick={() => onEditar(entrada)}>
          <Icon path={mdiPencil} />
          Editar
        </Button>
        <Button variante="peligro" onClick={() => onEliminar(entrada)}>
          <Icon path={mdiDelete} />
          Eliminar
        </Button>
      </div>
    </article>
  );
}
