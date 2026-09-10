import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { loginSchema } from '@pokedex/shared';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { useAuth } from '../useAuth';
import { useAuthSubmit } from '../useAuthSubmit';
import { AuthCard } from './AuthCard';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { errores, mensaje, enviando, enviar, limpiarError } = useAuthSubmit(
    loginSchema,
    async (datos) => {
      await login(datos);
      // Si llegó aquí por intentar abrir una página privada, se le devuelve allí.
      const destino = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(destino, { replace: true });
    },
  );

  function manejarEnvio(event: FormEvent) {
    event.preventDefault();
    void enviar({ email, password });
  }

  return (
    <AuthCard
      titulo="Bienvenido de vuelta"
      subtitulo="Entra para ver tu colección"
      pie={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/crear-cuenta" className={styles.enlace}>
            Crear una
          </Link>
        </>
      }
    >
      {/* `noValidate` apaga los mensajes del navegador para usar los nuestros, que
          además son los mismos que devuelve el servidor. */}
      <form className={styles.formulario} onSubmit={manejarEnvio} noValidate>
        {mensaje && <Alert>{mensaje}</Alert>}

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
          autoComplete="current-password"
          error={errores.password}
          onChange={(event) => {
            setPassword(event.target.value);
            limpiarError('password');
          }}
        />

        <Button type="submit" anchoCompleto cargando={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthCard>
  );
}
