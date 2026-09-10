import type { ReactNode } from 'react';

import styles from './EmptyState.module.css';

interface Props {
  titulo: string;
  texto: string;
  accion?: ReactNode;
}

/** Una lista sin resultados no se deja nunca en blanco. */
export function EmptyState({ titulo, texto, accion }: Props) {
  return (
    <section className={styles.vacio}>
      <h2 className={styles.titulo}>{titulo}</h2>
      <p className={styles.texto}>{texto}</p>
      {accion && <div className={styles.accion}>{accion}</div>}
    </section>
  );
}
