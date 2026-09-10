import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import styles from './TextField.module.css';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  ayuda?: string;
}

export function TextField({ label, error, ayuda, ...rest }: Props) {
  // `useId` da identificadores únicos y estables, que es lo que hace falta para
  // enlazar la etiqueta con el input y el input con su mensaje de error.
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  return (
    <div className={styles.campo}>
      <label className={styles.etiqueta} htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        className={`${styles.entrada} ${error ? styles.conError : ''}`}
        aria-invalid={error ? true : undefined}
        // Gracias a esto el lector de pantalla lee el error junto al campo.
        aria-describedby={error ? idError : ayuda ? idAyuda : undefined}
        {...rest}
      />

      {error ? (
        <p id={idError} className={styles.mensajeError} role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p id={idAyuda} className={styles.ayuda}>
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
