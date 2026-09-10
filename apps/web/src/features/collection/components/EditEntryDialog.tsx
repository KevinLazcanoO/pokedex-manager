import { useState } from 'react';
import type { FormEvent } from 'react';

import { type CollectionEntry, updateEntrySchema } from '@pokedex/shared';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { TextArea } from '../../../components/ui/TextArea';
import { TextField } from '../../../components/ui/TextField';
import { ApiError } from '../../../lib/api-client';
import { validateForm } from '../../../lib/validation';
import { useUpdateEntry } from '../queries';
import styles from './EditEntryDialog.module.css';

interface Props {
  /** La entrada que se edita, o `null` si el dialogo esta cerrado. */
  entrada: CollectionEntry | null;
  onCerrar: () => void;
}

const MAXIMO_NOTAS = 500;

/**
 * Formulario para cambiar el apodo y las notas de una entrada.
 *
 * Quien lo usa le pasa una `key` distinta por entrada, y ahí está el truco: al
 * cambiar la `key` React desmonta y vuelve a montar el componente, y el formulario
 * se inicializa solo con los datos de la nueva. Lo habitual es un `useEffect` que
 * copie las props al estado, pero eso es sincronizar a mano algo que React ya hace
 * y, de propina, pisa lo que estés escribiendo si la caché se refresca.
 */
export function EditEntryDialog({ entrada, onCerrar }: Props) {
  // Los inicializadores solo corren en el primer render de cada montaje, que
  // gracias a la `key` es justo una vez por entrada.
  const [apodo, setApodo] = useState(entrada?.nickname ?? '');
  const [notas, setNotas] = useState(entrada?.notes ?? '');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  const actualizar = useUpdateEntry();

  async function manejarEnvio(event: FormEvent) {
    event.preventDefault();
    if (!entrada) return;

    // Vaciar el campo significa quitar el apodo, y eso en la API es `null`. Mandar
    // cadena vacía guardaría un apodo en blanco, que no es lo mismo.
    const cambios = {
      nickname: apodo.trim() === '' ? null : apodo.trim(),
      notes: notas.trim() === '' ? null : notas.trim(),
    };

    const validacion = validateForm(updateEntrySchema, cambios);
    if (!validacion.ok) {
      setErrores(validacion.fields);
      return;
    }

    setErrores({});
    setMensaje(null);

    try {
      await actualizar.mutateAsync({ id: entrada.id, ...validacion.data });
      onCerrar();
    } catch (error) {
      setMensaje(error instanceof ApiError ? error.message : 'No se pudo guardar el cambio');
    }
  }

  return (
    <Modal
      abierto={entrada !== null}
      titulo={`Editar ${entrada?.nickname ?? entrada?.name ?? ''}`}
      onCerrar={onCerrar}
    >
      <form className={styles.formulario} onSubmit={manejarEnvio} noValidate>
        {mensaje && <Alert>{mensaje}</Alert>}

        <TextField
          label="Apodo"
          value={apodo}
          placeholder={entrada?.name ?? ''}
          ayuda="Déjalo vacío para usar el nombre real"
          error={errores.nickname}
          onChange={(event) => setApodo(event.target.value)}
        />

        <TextArea
          label="Notas"
          value={notas}
          maximo={MAXIMO_NOTAS}
          placeholder="Dónde lo capturaste, por qué te gusta..."
          error={errores.notes}
          onChange={(event) => setNotas(event.target.value)}
        />

        <div className={styles.acciones}>
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" cargando={actualizar.isPending}>
            {actualizar.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
