import { Link } from 'react-router-dom';
import { mdiAlertCircleOutline, mdiAutoFix, mdiCheck, mdiChevronRight } from '@mdi/js';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { Spinner } from '../../../components/ui/Spinner';
import { useAnalysisStatus, useGenerateAnalysis } from '../queries';
import styles from './AnalysisPanel.module.css';

const formatoFecha = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

interface Props {
  /** Con la colección vacía no hay nada que analizar, así que ni se ofrece. */
  coleccionVacia: boolean;
}

export function AnalysisPanel({ coleccionVacia }: Props) {
  const estado = useAnalysisStatus();
  const analisis = useGenerateAnalysis();

  // Mientras se comprueba, no se pinta nada: es un extra, no debe hacer saltar
  // la página con un hueco que aparece y desaparece.
  if (estado.isPending || estado.isError) return null;

  const sinCupo = estado.data.remainingToday === 0;
  const resultado = analisis.data;

  return (
    <section className={styles.panel} aria-labelledby="titulo-analisis">
      <div className={styles.encabezado}>
        <div>
          <h2 className={styles.titulo} id="titulo-analisis">
            <Icon path={mdiAutoFix} className={styles.icono} />
            Análisis de tu colección
          </h2>
          <p className={styles.introduccion}>
            Un vistazo con IA a tus puntos fuertes, tus carencias y qué capturar después.
          </p>
        </div>

        {estado.data.available && (
          <Button
            cargando={analisis.isPending}
            disabled={coleccionVacia || sinCupo}
            onClick={() => analisis.mutate()}
          >
            <Icon path={mdiAutoFix} />
            {analisis.isPending ? 'Analizando...' : resultado ? 'Analizar otra vez' : 'Analizar'}
          </Button>
        )}
      </div>

      {!estado.data.available && (
        <div className={styles.apagado}>
          <p>
            <Icon path={mdiAlertCircleOutline} /> Esta función está desactivada en este servidor.
          </p>
          <p>
            Para activarla, añade tu propia clave de la API de Anthropic como{' '}
            <code className={styles.codigo}>ANTHROPIC_API_KEY</code> en{' '}
            <code className={styles.codigo}>apps/api/.env</code> y reinicia la API. El resto de la
            aplicación funciona igual sin ella.
          </p>
        </div>
      )}

      {estado.data.available && sinCupo && (
        <p className={styles.cupo}>Has agotado tus análisis de hoy. Vuelve mañana.</p>
      )}

      {estado.data.available && !sinCupo && estado.data.remainingToday !== null && (
        <p className={styles.cupo}>Te quedan {estado.data.remainingToday} análisis hoy.</p>
      )}

      {analisis.isError && <Alert>{analisis.error.message}</Alert>}
      {analisis.isPending && <Spinner mensaje="Pensando sobre tu colección..." />}

      {resultado && !analisis.isPending && (
        <div className={styles.resultado}>
          <p className={styles.resumen}>{resultado.summary}</p>

          <div className={styles.columnas}>
            <div>
              <h3 className={styles.tituloSeccion}>Lo que tienes bien</h3>
              <ul className={styles.lista}>
                {resultado.strengths.map((punto) => (
                  <li className={styles.elemento} key={punto}>
                    <Icon path={mdiCheck} className={styles.marcaFuerte} />
                    {punto}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={styles.tituloSeccion}>Lo que te falta</h3>
              <ul className={styles.lista}>
                {resultado.gaps.map((hueco) => (
                  <li className={styles.elemento} key={hueco}>
                    <Icon path={mdiAlertCircleOutline} className={styles.marcaHueco} />
                    {hueco}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className={styles.tituloSeccion}>Qué capturar después</h3>
            <div className={styles.recomendaciones}>
              {resultado.recommendations.map((recomendacion) => (
                <article className={styles.recomendacion} key={recomendacion.name}>
                  {/* El nombre lo elige la IA, así que puede no existir en la
                      PokéAPI. El enlace lleva al detalle, que ya sabe mostrar un
                      error claro si ese Pokémon no está. */}
                  <Link
                    className={styles.nombreRecomendado}
                    to={`/pokemon/${encodeURIComponent(recomendacion.name)}`}
                  >
                    {recomendacion.name}
                    <Icon path={mdiChevronRight} />
                  </Link>
                  <p className={styles.motivo}>{recomendacion.reason}</p>
                </article>
              ))}
            </div>
          </div>

          <p className={styles.pie}>
            Generado por {resultado.model} el {formatoFecha.format(new Date(resultado.generatedAt))}
            {resultado.cached && ' · reutilizado, tu colección no ha cambiado desde entonces'}
          </p>
        </div>
      )}
    </section>
  );
}
