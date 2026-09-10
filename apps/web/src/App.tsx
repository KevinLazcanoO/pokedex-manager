import { Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { CollectionPage } from './features/collection/pages/CollectionPage';
import { ExplorePage } from './features/pokedex/pages/ExplorePage';
import { PokemonDetailPage } from './features/pokedex/pages/PokemonDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';

/**
 * El mapa de rutas.
 *
 * Van agrupadas por quién puede verlas: las públicas echan a quien ya tiene sesión
 * y las privadas mandan al login a quien no la tiene. La regla está en un sitio, no
 * repetida dentro de cada pantalla.
 */
export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/crear-cuenta" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<CollectionPage />} />
          <Route path="/explorar" element={<ExplorePage />} />
          <Route path="/pokemon/:idOrName" element={<PokemonDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
