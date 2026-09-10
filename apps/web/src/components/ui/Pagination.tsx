import { Button } from './Button';
import styles from './Pagination.module.css';

interface Props {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}

export function Pagination({ pagina, totalPaginas, onCambiar }: Props) {
  // Con una sola página la paginación sobra y solo ocupa sitio.
  if (totalPaginas <= 1) return null;

  return (
    <nav className={styles.paginacion} aria-label="Paginación">
      <Button
        variante="secundario"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 1}
      >
        Anterior
      </Button>

      {/* Con `aria-live` el lector de pantalla anuncia el cambio de página, que
          de otro modo pasa desapercibido. */}
      <span className={styles.indicador} aria-live="polite">
        Página {pagina} de {totalPaginas}
      </span>

      <Button
        variante="secundario"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= totalPaginas}
      >
        Siguiente
      </Button>
    </nav>
  );
}
