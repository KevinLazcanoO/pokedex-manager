import type { ReactNode } from 'react';
import { mdiAlertCircleOutline, mdiCheckCircleOutline } from '@mdi/js';

import { Icon } from './Icon';
import styles from './Alert.module.css';

interface Props {
  tono?: 'error' | 'exito';
  children: ReactNode;
}

export function Alert({ tono = 'error', children }: Props) {
  return (
    // Con role="alert" el lector de pantalla lo lee en cuanto aparece, sin que
    // el usuario tenga que ir a buscarlo.
    <div className={`${styles.alerta} ${styles[tono]}`} role="alert">
      <Icon
        className={styles.icono}
        path={tono === 'error' ? mdiAlertCircleOutline : mdiCheckCircleOutline}
      />
      <span>{children}</span>
    </div>
  );
}
