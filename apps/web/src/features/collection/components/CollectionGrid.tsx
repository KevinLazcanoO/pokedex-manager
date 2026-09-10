import type { CollectionEntry } from '@pokedex/shared';

import { CollectionCard } from './CollectionCard';
import styles from './CollectionGrid.module.css';

interface Props {
  entradas: CollectionEntry[];
  onEditar: (entrada: CollectionEntry) => void;
  onEliminar: (entrada: CollectionEntry) => void;
  onAlternarFavorito: (entrada: CollectionEntry) => void;
}

export function CollectionGrid({ entradas, ...manejadores }: Props) {
  return (
    <div className={styles.grid}>
      {entradas.map((entrada) => (
        <CollectionCard key={entrada.id} entrada={entrada} {...manejadores} />
      ))}
    </div>
  );
}
