import { useId } from 'react';

import { COLLECTION_SORT_OPTIONS, type CollectionSort } from '@pokedex/shared';

import { TextField } from '../../../components/ui/TextField';
import styles from './CollectionFilters.module.css';

interface Props {
  busqueda: string;
  tipo: string;
  soloFavoritos: boolean;
  orden: CollectionSort;
  /** Solo los tipos que hay en la colección: ofrecer el resto no lleva a nada. */
  tiposDisponibles: string[];
  onBusquedaChange: (valor: string) => void;
  onTipoChange: (valor: string) => void;
  onFavoritosChange: (valor: boolean) => void;
  onOrdenChange: (valor: CollectionSort) => void;
}

const ETIQUETAS_ORDEN: Record<CollectionSort, string> = {
  recent: 'Más recientes',
  oldest: 'Más antiguos',
  name: 'Nombre (A-Z)',
  pokemonId: 'Número de Pokédex',
};

export function CollectionFilters({
  busqueda,
  tipo,
  soloFavoritos,
  orden,
  tiposDisponibles,
  onBusquedaChange,
  onTipoChange,
  onFavoritosChange,
  onOrdenChange,
}: Props) {
  const idTipo = useId();
  const idOrden = useId();

  return (
    <div className={styles.barra}>
      <div className={styles.busqueda}>
        <TextField
          label="Buscar"
          type="search"
          value={busqueda}
          placeholder="Nombre o apodo"
          onChange={(event) => onBusquedaChange(event.target.value)}
        />
      </div>

      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={idTipo}>
          Tipo
        </label>
        <select
          id={idTipo}
          className={`${styles.select} ${styles.selectTipo}`}
          value={tipo}
          onChange={(event) => onTipoChange(event.target.value)}
        >
          <option value="">Todos</option>
          {tiposDisponibles.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.campo}>
        <label className={styles.etiqueta} htmlFor={idOrden}>
          Ordenar por
        </label>
        <select
          id={idOrden}
          className={styles.select}
          value={orden}
          onChange={(event) => onOrdenChange(event.target.value as CollectionSort)}
        >
          {COLLECTION_SORT_OPTIONS.map((opcion) => (
            <option key={opcion} value={opcion}>
              {ETIQUETAS_ORDEN[opcion]}
            </option>
          ))}
        </select>
      </div>

      {/* La etiqueta envuelve la casilla, así pulsar el texto también la marca. */}
      <label className={styles.interruptor}>
        <input
          type="checkbox"
          className={styles.casilla}
          checked={soloFavoritos}
          onChange={(event) => onFavoritosChange(event.target.checked)}
        />
        Solo favoritos
      </label>
    </div>
  );
}
