import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import styles from './TextArea.module.css';

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string;
  /** Si se pasa, aparece un contador de caracteres debajo. */
  maximo?: number;
}

export function TextArea({ label, error, maximo, value, ...rest }: Props) {
  const id = useId();
  const idError = `${id}-error`;

  const longitud = typeof value === 'string' ? value.length : 0;
  const pasado = maximo !== undefined && longitud > maximo;

  return (
    <div className={styles.campo}>
      <label className={styles.etiqueta} htmlFor={id}>
        {label}
      </label>

      <textarea
        id={id}
        className={`${styles.area} ${error ? styles.conError : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        value={value}
        {...rest}
      />

      {(error || maximo !== undefined) && (
        <div className={styles.pie}>
          {error && (
            <p id={idError} className={styles.mensajeError} role="alert">
              {error}
            </p>
          )}
          {maximo !== undefined && (
            <span className={`${styles.contador} ${pasado ? styles.contadorPasado : ''}`}>
              {longitud}/{maximo}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
