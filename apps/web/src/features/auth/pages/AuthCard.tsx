import type { ReactNode } from 'react';
import { mdiPokeball } from '@mdi/js';

import { Icon } from '../../../components/ui/Icon';
import styles from './AuthPage.module.css';

interface Props {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  pie: ReactNode;
}

// El marco visual que comparten entrar y crear cuenta.
export function AuthCard({ titulo, subtitulo, children, pie }: Props) {
  return (
    <div className={styles.pantalla}>
      <div className={styles.tarjeta}>
        <div className={styles.marca}>
          <Icon path={mdiPokeball} size="1.6em" className={styles.logo} />
          PokéDex Manager
        </div>

        <h1 className={styles.titulo}>{titulo}</h1>
        <p className={styles.subtitulo}>{subtitulo}</p>

        {children}

        <p className={styles.pie}>{pie}</p>
      </div>
    </div>
  );
}
