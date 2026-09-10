import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './Button.module.css';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  anchoCompleto?: boolean;
  /** Bloquea el botón mientras hay una operación en marcha. */
  cargando?: boolean;
  children: ReactNode;
}

export function Button({
  variante = 'primario',
  anchoCompleto = false,
  cargando = false,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  const clases = [
    styles.boton,
    styles[variante],
    anchoCompleto ? styles.anchoCompleto : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={clases}
      disabled={disabled === true || cargando}
      // Para que un lector de pantalla diga que está ocupado, no que está roto.
      aria-busy={cargando}
      {...rest}
    >
      {children}
    </button>
  );
}
