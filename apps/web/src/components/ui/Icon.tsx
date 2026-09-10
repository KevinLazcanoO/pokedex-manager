import MdiIcon from '@mdi/react';

interface Props {
  /** Constante de `@mdi/js`, por ejemplo `mdiStar`. */
  path: string;
  /** Por defecto va ligado al tamaño del texto de al lado. */
  size?: string;
  /** Solo para iconos que aportan información propia; el resto son decorativos. */
  title?: string;
  spin?: boolean;
  className?: string;
}

// Envoltorio sobre @mdi/react, para no repetir el tamaño y el aria-hidden en cada
// uso y para que cambiar de librería de iconos sea tocar un solo archivo.
export function Icon({ path, size = '1.15em', title, spin = false, className }: Props) {
  return (
    <MdiIcon
      path={path}
      size={size}
      spin={spin}
      className={className}
      title={title}
      // Un icono junto a un texto visible se acaba anunciando dos veces si no se
      // oculta. Los que llevan `title` son los que dicen algo que no está al lado.
      aria-hidden={title ? undefined : true}
    />
  );
}
