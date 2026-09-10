import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { Button } from './ui/Button';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * La última red de la interfaz.
 *
 * Si un componente lanza al renderizar, React desmonta el árbol entero y el usuario
 * se queda con una página en blanco, sin saber qué ha pasado ni qué hacer. Esto lo
 * convierte al menos en una explicación y una salida.
 *
 * Tiene que ser un componente de clase; es la única forma que da React de capturar
 * errores de renderizado y no hay equivalente con hooks.
 *
 * Ojo: no atrapa fallos asíncronos, como una petición que falla. De eso se ocupan
 * los estados de error de cada consulta.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // En producción esto iría a un Sentry o similar. Aquí basta con la consola.
    console.error('Error no controlado en la interfaz:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={styles.pantalla}>
        <div>
          <h1 className={styles.titulo}>Algo se ha roto</h1>
          <p className={styles.texto}>
            Ha ocurrido un error inesperado en la aplicación. Puedes recargar la pagina para
            volver a empezar; tus datos estan guardados en el servidor.
          </p>

          <Button onClick={() => window.location.reload()}>Recargar la página</Button>

          {/* El detalle técnico solo en desarrollo: al usuario final no le sirve
              y puede destapar información interna. */}
          {import.meta.env.DEV && <pre className={styles.detalle}>{error.message}</pre>}
        </div>
      </div>
    );
  }
}
