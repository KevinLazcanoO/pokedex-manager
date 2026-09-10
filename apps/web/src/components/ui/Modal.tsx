import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { mdiClose } from '@mdi/js';

import { Icon } from './Icon';
import styles from './Modal.module.css';

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

/**
 * Diálogo modal montado sobre el `<dialog>` nativo.
 *
 * Se usa el nativo y no un div con position fixed porque el navegador ya resuelve
 * gratis lo difícil y lo que siempre se olvida: atrapar el foco dentro, cerrar con
 * Escape, esconder el contenido de detrás a los lectores y pintar el fondo.
 */
export function Modal({ abierto, titulo, onCerrar, children }: Props) {
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;

    // `showModal()` es lo que enciende el comportamiento modal. Poner el atributo
    // `open` a mano lo abre sin foco atrapado y sin fondo, que no sirve de nada.
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={referencia}
      className={styles.dialogo}
      aria-label={titulo}
      // Escape cierra el diálogo por su cuenta, saltándose el estado de React: el
      // DOM se queda cerrado, React lo sigue creyendo abierto y volver a pulsar el
      // mismo botón ya no lo reabre, porque el estado no cambia y no hay re-render.
      // Así que se cancela ese cierre nativo y se pide el cierre por donde lo piden
      // los botones. React es lo único que abre y cierra, y no pueden divergir.
      onCancel={(event) => {
        event.preventDefault();
        onCerrar();
      }}
      // Pulsar fuera cierra. El clic cae en el propio `<dialog>` porque todo el
      // contenido está en elementos hijos.
      onClick={(event) => {
        if (event.target === referencia.current) onCerrar();
      }}
    >
      <div className={styles.cabecera}>
        <h2 className={styles.titulo}>{titulo}</h2>
        <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
          <Icon path={mdiClose} size="1.25em" />
        </button>
      </div>

      <div className={styles.cuerpo}>{children}</div>
    </dialog>
  );
}
