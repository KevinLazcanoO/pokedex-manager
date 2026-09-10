import type { CollectionStats } from '@pokedex/shared';

import { TypeBadge } from '../../../components/ui/TypeBadge';
import styles from './StatsPanel.module.css';

interface Props {
  stats: CollectionStats;
}

/** Cuántos tipos se enseñan antes de resumir el resto en un "+N más". */
const TIPOS_VISIBLES = 6;

/**
 * Recibe los datos ya cargados en lugar de pedirlos. Así se puede pintar en
 * cualquier sitio y probarlo no cuesta nada.
 */
export function StatsPanel({ stats }: Props) {
  const tiposVisibles = stats.byType.slice(0, TIPOS_VISIBLES);
  const tiposRestantes = stats.byType.length - tiposVisibles.length;

  return (
    <section className={styles.panel} aria-label="Resumen de tu colección">
      <article className={styles.tarjeta}>
        <h2 className={styles.titulo}>Capturados</h2>
        <p className={styles.numero}>{stats.total}</p>
      </article>

      <article className={styles.tarjeta}>
        <h2 className={styles.titulo}>Favoritos</h2>
        <p className={styles.numero}>{stats.favorites}</p>
      </article>

      <article className={styles.tarjeta}>
        <h2 className={styles.titulo}>Tipos distintos</h2>
        {stats.byType.length === 0 ? (
          <p className={styles.numero}>0</p>
        ) : (
          <>
            <p className={styles.numero}>{stats.uniqueTypes}</p>
            <div className={styles.tipos}>
              {tiposVisibles.map((entrada) => (
                <TypeBadge key={entrada.type} tipo={entrada.type} />
              ))}
              {tiposRestantes > 0 && (
                <span className={styles.detalleDestacado}>+{tiposRestantes} más</span>
              )}
            </div>
          </>
        )}
      </article>

      <article className={styles.tarjeta}>
        <h2 className={styles.titulo}>El más fuerte</h2>
        {stats.strongest ? (
          <div className={styles.destacado}>
            {stats.strongest.spriteUrl && (
              <img
                className={styles.miniatura}
                src={stats.strongest.spriteUrl}
                alt=""
                width={56}
                height={56}
                loading="lazy"
              />
            )}
            <div>
              {/* El mismo nombre que en la tarjeta: manda el apodo. */}
              <p className={styles.nombreDestacado}>
                {stats.strongest.nickname ?? stats.strongest.name}
              </p>
              <p className={styles.detalleDestacado}>
                {stats.strongest.baseStatTotal} puntos base
              </p>
            </div>
          </div>
        ) : (
          <p className={styles.vacio}>Aún no has capturado ninguno</p>
        )}
      </article>
    </section>
  );
}
