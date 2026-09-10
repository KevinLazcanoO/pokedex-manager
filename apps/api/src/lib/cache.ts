interface Entry<T> {
  value: T;
  expiresAt: number;
}

// Caché en memoria con caducidad. Los datos de la PokéAPI no cambian nunca en la
// práctica, así que guardarlos ahorra cientos de peticiones repetidas.
//
// Es simple a propósito: vive en el proceso y se pierde al reiniciar. Con varias
// instancias en producción esto sería Redis, y solo habría que tocar esta clase.
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();

  /** Peticiones ya lanzadas y sin resolver, para no pedir dos veces lo mismo. */
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Devuelve lo cacheado o lo calcula y lo guarda.
   *
   * Si dos peticiones piden lo mismo a la vez, la segunda se engancha a la promesa
   * de la primera. Sin esto, pintar una página de 24 tarjetas llegaba a pedir el
   * mismo tipo 24 veces.
   */
  async remember(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const promise = load()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => {
        // Se libera pase lo que pase. Si la llamada falló, el siguiente intento
        // tiene que poder reintentar y no quedarse pegado a una promesa rota.
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }
}
