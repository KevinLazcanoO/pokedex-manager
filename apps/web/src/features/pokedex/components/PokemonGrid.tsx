import type { PokemonSummary } from '@pokedex/shared';

import { PokemonCard } from './PokemonCard';
import styles from './PokemonGrid.module.css';

interface Props {
  pokemon: PokemonSummary[];
  capturados: Set<number>;
  /** Id que se esta capturando ahora mismo, o `null` si no hay ninguno. */
  capturandoId: number | null;
  onCapturar: (pokemonId: number) => void;
}

export function PokemonGrid({ pokemon, capturados, capturandoId, onCapturar }: Props) {
  return (
    <div className={styles.grid}>
      {pokemon.map((individuo) => (
        <PokemonCard
          key={individuo.pokemonId}
          pokemon={individuo}
          capturado={capturados.has(individuo.pokemonId)}
          capturando={capturandoId === individuo.pokemonId}
          onCapturar={onCapturar}
        />
      ))}
    </div>
  );
}
