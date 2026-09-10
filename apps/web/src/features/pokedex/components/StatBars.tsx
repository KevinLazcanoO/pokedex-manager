import type { PokemonStat } from '@pokedex/shared';

import styles from '../pages/PokemonDetailPage.module.css';

/**
 * El máximo que puede tener una estadística base en el juego. Se usa como
 * referencia fija para el ancho de las barras: si se escalara al máximo del propio
 * Pokémon, uno flojo se vería igual de fuerte que un legendario.
 */
const MAXIMO_ESTADISTICA = 255;

/** La PokéAPI los da en inglés y en jerga; aquí se traducen para pintarlos. */
const NOMBRES: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. especial',
  'special-defense': 'Def. especial',
  speed: 'Velocidad',
};

export function StatBars({ stats }: { stats: PokemonStat[] }) {
  return (
    <div className={styles.estadisticas}>
      {stats.map((estadistica) => {
        const porcentaje = Math.round((estadistica.value / MAXIMO_ESTADISTICA) * 100);

        return (
          <div className={styles.estadistica} key={estadistica.name}>
            <span className={styles.nombreEstadistica}>
              {NOMBRES[estadistica.name] ?? estadistica.name}
            </span>
            <span className={styles.valorEstadistica}>{estadistica.value}</span>
            {/* La barra es decorativa. El número de al lado ya da el dato, así que
                se oculta a los lectores para no decirlo dos veces. */}
            <div className={styles.barra} aria-hidden="true">
              <div className={styles.relleno} style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
