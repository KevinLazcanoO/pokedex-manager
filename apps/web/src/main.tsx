import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AUTH_QUERY_KEY, AuthProvider } from './features/auth/AuthProvider';
import { ApiError } from './lib/api-client';
import './styles/global.css';

/**
 * Un 401 en cualquier petición significa que el servidor ya no reconoce la cookie.
 *
 * Se marca la sesión como cerrada aquí y el resto pasa solo: `ProtectedRoute` ve
 * que no hay usuario y lleva al login. La alternativa es comprobar el 401 en cada
 * pantalla, y basta olvidarse en una para dejar al usuario ante un error que no
 * puede resolver.
 */
function manejarSesionCaducada(error: unknown): void {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
  }
}

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: manejarSesionCaducada }),
  mutationCache: new MutationCache({ onError: manejarSesionCaducada }),
  defaultOptions: {
    queries: {
      // La PokéAPI no cambia nunca en la práctica y la colección solo cambia por
      // lo que hace el propio usuario. Cinco minutos evitan pedir lo mismo cada
      // vez que se cambia de pantalla.
      staleTime: 5 * 60 * 1000,
      retry: (fallos, error) => {
        // Un 4xx no se arregla repitiendo: el Pokémon no existe, los datos no
        // valen o falta la sesión. Reintentar solo hace esperar para acabar
        // enseñando el mismo mensaje.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Para lo demás (un 500, la red que se cae) con un reintento basta.
        return fallos < 1;
      },
      // React Query pausa los reintentos si el navegador dice estar sin conexión,
      // y entonces la consulta se queda "cargando" para siempre sin avisar de
      // nada. Mejor intentarlo igual: `apiRequest` ya convierte un fallo de red en
      // un error con mensaje, y eso sí se puede enseñar.
      networkMode: 'always',
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Igual que en las consultas: una mutación pausada deja el botón en
      // "Capturando..." para siempre.
      networkMode: 'always',
    },
  },
});

const contenedor = document.getElementById('root');
if (!contenedor) throw new Error('No se encontro el elemento #root en index.html');

createRoot(contenedor).render(
  <StrictMode>
    {/* La barrera va lo más afuera posible para atrapar también los fallos de los
        proveedores, no solo los de las pantallas. */}
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* AuthProvider va dentro del router porque las pantallas de sesión
              navegan, y dentro de QueryClient porque la sesión se pide con él. */}
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
