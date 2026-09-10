/** Un Pokémon que la IA sugiere añadir, con el motivo. */
export interface AnalysisRecommendation {
  name: string;
  reason: string;
}

/** El análisis de la colección que devuelve la IA. */
export interface CollectionAnalysis {
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: AnalysisRecommendation[];
  /** Cuándo se generó. Un análisis servido desde la caché conserva su fecha original. */
  generatedAt: string;
  model: string;
  /** `true` si viene de la caché y por tanto no ha costado una llamada nueva. */
  cached: boolean;
}

/**
 * Estado de la función, para que la interfaz sepa si ofrecerla.
 *
 * Sin clave configurada en el servidor, `available` es `false` y la pantalla
 * explica cómo activarla en lugar de enseñar un botón que siempre falla.
 */
export interface AnalysisStatus {
  available: boolean;
  /** Análisis que le quedan hoy al usuario, o `null` si la función está apagada. */
  remainingToday: number | null;
}
