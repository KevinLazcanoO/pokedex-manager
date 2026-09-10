import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { mdiLogout, mdiPokeball } from '@mdi/js';

import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../features/auth/useAuth';
import styles from './AppLayout.module.css';

const ENLACES = [
  { to: '/', label: 'Mi colección', end: true },
  { to: '/explorar', label: 'Explorar', end: false },
];

/** El marco de las pantallas privadas: cabecera fija y contenedor centrado. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function cerrarSesion() {
    await logout();
    navigate('/entrar', { replace: true });
  }

  return (
    <>
      <a className={styles.saltar} href="#contenido">
        Saltar al contenido
      </a>

      <header className={styles.cabecera}>
        <div className={styles.contenedorCabecera}>
          <NavLink to="/" className={styles.marca}>
            <Icon path={mdiPokeball} size="1.4em" className={styles.pokebola} />
            <span>PokéDex Manager</span>
          </NavLink>

          <nav className={styles.navegacion} aria-label="Principal">
            {ENLACES.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.end}
                className={({ isActive }) =>
                  `${styles.enlace} ${isActive ? styles.enlaceActivo : ''}`
                }
              >
                {enlace.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.usuario}>
            <span className={styles.nombre}>{user?.displayName}</span>
            <Button variante="fantasma" onClick={cerrarSesion}>
              <Icon path={mdiLogout} />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* `tabIndex={-1}` es lo que deja que el enlace de salto le lleve el foco de
          verdad. Sin eso, el navegador solo desplaza la página. */}
      <main id="contenido" className={styles.principal} tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
