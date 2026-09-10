import { useId } from 'react';

import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import styles from './Filters.module.css';

interface Props {
  busqueda: string;
  tipo: string;
  tipos: string[];
  onBusquedaChange: (valor: string) => void;
  onTipoChange: (valor: string) => void;
  onLimpiar: () => void;
}

export function Filters({
  busqueda,
  tipo,
  tipos,
  onBusquedaChange,
  onTipoChange,
  onLimpiar,
}: Props) {
  const idTipo = useId();
  const hayFiltros = busqueda !== '' || tipo !== '';

  return (
    <div className={styles.barra}>
      <div className={styles.busqueda}>
        <TextField
          label="Buscar"
          type="search"
          value={busqueda}
          placeholder="pikachu, char, mew..."
          onChange={(event) => onBusquedaChange(event.target.value)}
        />
      </div>

      <div className={styles.campoSelect}>
        <label className={styles.etiqueta} htmlFor={idTipo}>
          Tipo
        </label>
        <select
          id={idTipo}
          className={styles.select}
          value={tipo}
          onChange={(event) => onTipoChange(event.target.value)}
        >
          <option value="">Todos</option>
          {tipos.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      {/* El botón solo aparece si hay algo que limpiar. Un control que no hace
          nada despista más de lo que ayuda. */}
      {hayFiltros && (
        <div className={styles.limpiar}>
          <Button variante="fantasma" onClick={onLimpiar}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
