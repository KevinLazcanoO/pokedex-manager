import { mdiLoading } from '@mdi/js';

import { Icon } from './Icon';
import styles from './Spinner.module.css';

interface Props {
  mensaje?: string;
}

export function Spinner({ mensaje = 'Cargando...' }: Props) {
  return (
    <div className={styles.contenedor} role="status">
      <Icon path={mdiLoading} size="2rem" spin className={styles.rueda} />
      <p>{mensaje}</p>
    </div>
  );
}
