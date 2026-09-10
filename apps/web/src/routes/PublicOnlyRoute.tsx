import { Navigate, Outlet } from 'react-router-dom';

import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../features/auth/useAuth';

/** Entrar y crear cuenta: quien ya tiene sesión no debería volver a verlas. */
export function PublicOnlyRoute() {
  const { user, comprobandoSesion } = useAuth();

  if (comprobandoSesion) {
    return <Spinner mensaje="Comprobando tu sesión..." />;
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
}
