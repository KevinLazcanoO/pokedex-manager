interface Contador {
  usos: number;
  reinicioEn: number;
}

/**
 * Limitador de uso por ventana de tiempo.
 *
 * Existe para una cosa concreta: el análisis con IA cuesta dinero en la clave de
 * quien ejecuta el proyecto. Sin un tope, a alguien le basta con registrarse y
 * pulsar el botón en bucle para dispararle la factura.
 *
 * Vive en memoria y se pierde al reiniciar, igual que la caché de la PokéAPI. Con
 * varias instancias en producción el reemplazo sería Redis y solo cambiaría esta
 * clase; para un proyecto que se ejecuta en una máquina es suficiente.
 */
export class LimitadorDeUso {
  private readonly contadores = new Map<string, Contador>();

  constructor(
    private readonly maximo: number,
    private readonly ventanaMs: number,
  ) {}

  private contadorDe(clave: string): Contador {
    const actual = this.contadores.get(clave);
    if (actual && actual.reinicioEn > Date.now()) return actual;

    const nuevo = { usos: 0, reinicioEn: Date.now() + this.ventanaMs };
    this.contadores.set(clave, nuevo);
    return nuevo;
  }

  usosRestantes(clave: string): number {
    return Math.max(0, this.maximo - this.contadorDe(clave).usos);
  }

  /**
   * Apunta un uso si queda cupo. Devuelve `false` cuando ya no queda.
   *
   * Comprobar y apuntar van juntos a propósito: si fueran dos pasos, dos
   * peticiones a la vez podrían pasar las dos la comprobación antes de que
   * ninguna sumara.
   */
  intentarConsumir(clave: string): boolean {
    const contador = this.contadorDe(clave);
    if (contador.usos >= this.maximo) return false;

    contador.usos += 1;
    return true;
  }

  /** Devuelve un uso ya apuntado, para no cobrarle al usuario un intento que falló. */
  devolver(clave: string): void {
    const contador = this.contadores.get(clave);
    if (contador && contador.usos > 0) contador.usos -= 1;
  }
}
