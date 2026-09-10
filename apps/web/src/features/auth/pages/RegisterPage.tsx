import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { registerSchema } from '@pokedex/shared';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { useAuth } from '../useAuth';
import { useAuthSubmit } from '../useAuthSubmit';
import { AuthCard } from './AuthCard';
import styles from './AuthPage.module.css';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { errores, mensaje, enviando, enviar, limpiarError } = useAuthSubmit(
    registerSchema,
    async (datos) => {
      await register(datos);
      // Crear la cuenta ya deja la sesión abierta, así que se entra directo.
      navigate('/', { replace: true });
    },
  );

  function manejarEnvio(event: FormEvent) {
    event.preventDefault();
    void enviar({ displayName, email, password });
  }

  return (
    <AuthCard
      titulo="Crea tu cuenta"
      subtitulo="Empieza a registrar tu colección"
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/entrar" className={styles.enlace}>
            Entrar
          </Link>
        </>
      }
    >
      <form className={styles.formulario} onSubmit={manejarEnvio} noValidate>
        {mensaje && <Alert>{mensaje}</Alert>}

        <TextField
          label="Nombre"
          value={displayName}
          autoComplete="name"
          placeholder="Ash Ketchum"
          error={errores.displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            limpiarError('displayName');
          }}
        />

        <TextField
          label="Correo"
          type="email"
          value={email}
          autoComplete="email"
          placeholder="ash@pueblopaleta.com"
          error={errores.email}
          onChange={(event) => {
            setEmail(event.target.value);
            limpiarError('email');
          }}
        />

        <TextField
          label="Contraseña"
          type="password"
          value={password}
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres"
          error={errores.password}
          onChange={(event) => {
            setPassword(event.target.value);
            limpiarError('password');
          }}
        />

        <Button type="submit" anchoCompleto cargando={enviando}>
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthCard>
  );
}
