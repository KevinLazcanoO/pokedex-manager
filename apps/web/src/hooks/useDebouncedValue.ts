import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(valor: T, retrasoMs = 300): T {
  const [valorConRetraso, setValorConRetraso] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorConRetraso(valor), retrasoMs);

    // Limpiar el temporizador anterior en cada cambio es lo que hace que la
    // cuenta atrás se reinicie mientras el usuario sigue escribiendo.
    return () => clearTimeout(temporizador);
  }, [valor, retrasoMs]);

  return valorConRetraso;
}
