import { Link } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.pantalla}>
      <div>
        <p className={styles.codigo}>404</p>
        <h1 className={styles.titulo}>Esta página no existe</h1>
        <p className={styles.texto}>Puede que el enlace esté mal o que la hayamos movido.</p>
        <Link to="/">
          <Button variante="secundario">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
