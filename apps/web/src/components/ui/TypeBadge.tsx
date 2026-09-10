import styles from './TypeBadge.module.css';

interface Props {
  tipo: string;
}

/** El color lo pone el CSS a partir del atributo `data-tipo`. */
export function TypeBadge({ tipo }: Props) {
  return (
    <span className={styles.insignia} data-tipo={tipo}>
      {tipo}
    </span>
  );
}
