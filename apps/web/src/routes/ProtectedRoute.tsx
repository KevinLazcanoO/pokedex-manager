import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../features/auth/useAuth';

/**
 * Envuelve las rutas privadas.
 *
 * Es comodidad, no seguridad: cualquiera puede saltársela desde el navegador. La
 * protección de verdad está en el backend, donde `requireAuth` devuelve 401 aunque
 * la interfaz haya pintado la pantalla entera.
 */
export function ProtectedRoute() {
  const { user, comprobandoSesion } = useAuth();
  const location = useLocation();

  // Sin esta espera, recargar una página privada te manda al login un instante
  // antes de confirmar que la sesión sí valía.
  if (comprobandoSesion) {
    return <Spinner mensaje="Comprobando tu sesión..." />;
  }

  if (!user) {
    // Se guarda a dónde iba para devolverle allí tras iniciar sesión.
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
