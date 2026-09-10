import { Button } from './Button';
import { Modal } from './Modal';
import styles from './ConfirmDialog.module.css';

interface Props {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  confirmando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Confirmación para lo que no se puede deshacer.
 *
 * Cancelar va primero y es el botón neutro; el destructivo queda al otro lado para
 * que cueste pulsarlo por inercia.
 */
export function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  confirmando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCancelar}>
      <p className={styles.mensaje}>{mensaje}</p>

      <div className={styles.acciones}>
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variante="peligro" cargando={confirmando} onClick={onConfirmar}>
          {confirmando ? 'Eliminando...' : textoConfirmar}
        </Button>
      </div>
    </Modal>
  );
}
