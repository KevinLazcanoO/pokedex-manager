// Todos los endpoints fallan con esta misma forma. El frontend tiene así un solo
// camino para pintar errores, en vez de adivinar la estructura en cada llamada.
export interface ApiErrorBody {
  error: {
    message: string;
    /** Solo cuando la validación rechaza un formulario: campo -> mensaje. */
    fields?: Record<string, string>;
  };
}
