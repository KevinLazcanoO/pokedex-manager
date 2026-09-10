# PokéDex Manager

Aplicación web full-stack para gestionar una colección personal de Pokémon.
Incluye autenticación, integración con la [PokéAPI](https://pokeapi.co), persistencia
en base de datos e interfaz responsive.

---

## Requisitos

- **Node.js 20 o superior** (`node --version`)
- npm 9 o superior

No hace falta nada más: no hay que instalar ni levantar ninguna base de datos.

---

## Ejecutar
```bash
npm run setup
npm run dev
```

Abre **http://localhost:5173** y crea una cuenta.

`npm run setup` instala las dependencias, crea `apps/api/.env` con un
`JWT_SECRET` aleatorio y prepara el archivo SQLite. `npm run dev` levanta la API
en el puerto 4000 y la interfaz en el 5173.

> **El análisis con IA es opcional y viene desactivado.** La aplicación funciona
> entera sin él y no hace ninguna llamada externa de pago. Para probarlo hay que
> poner una clave propia — ver [Análisis con IA](#análisis-con-ia-opcional).

> **Nota sobre npm 11.** Las versiones recientes de npm bloquean por defecto los
> scripts de instalación de las dependencias. Prisma y esbuild los necesitan para
> descargar sus binarios, así que el repositorio ya los tiene aprobados en el
> campo `allowScripts` de `package.json`. No hay que hacer nada.

---

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run setup` | Instalación completa desde cero |
| `npm run dev` | Levanta API e interfaz a la vez |
| `npm run dev:api` / `npm run dev:web` | Levanta solo una de las dos |
| `npm test` | Ejecuta los 47 tests del backend |
| `npm run lint` | ESLint sobre todo el repositorio |
| `npm run typecheck` | Comprueba tipos de los tres paquetes |
| `npm run build` | Compilación de producción |
| `npm start` | Sirve la API ya compilada |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar los datos |

---

## Funcionalidades

**Autenticación**
- Registro e inicio de sesión con correo y contraseña
- Contraseñas cifradas con bcrypt
- Sesión mediante JWT en cookie `httpOnly`
- Rutas protegidas; la sesión caducada devuelve al login automáticamente

**Explorar (PokéAPI)**
- Catálogo completo (1025 Pokémon) con paginación
- Búsqueda por nombre y filtro por tipo, combinables
- Ficha de detalle con ilustración, estadísticas base, habilidades, altura y peso
- Los filtros viven en la URL: se pueden compartir y el botón "atrás" funciona

**Mi colección**
- Capturar y eliminar Pokémon (con confirmación)
- Apodo y notas personales editables
- Marcar favoritos
- Búsqueda por nombre o apodo, filtro por tipo, solo favoritos y cuatro criterios de orden
- Panel de estadísticas: total, favoritos, tipos distintos y el Pokémon más fuerte

**Análisis con IA (opcional)**
- Resumen del carácter de la colección, puntos fuertes y carencias
- Recomendaciones de qué capturar después, con el motivo de cada una
- Desactivado si no hay clave configurada, con límites de uso y caché de resultados

**Interfaz**
- Responsive real, verificado a 375 px
- Tema claro y oscuro según la preferencia del sistema
- Navegable por teclado, con enlace para saltar al contenido

---

## Arquitectura

Monorepo con workspaces de npm y TypeScript en todo el proyecto.

```
pokedex-manager/
├── packages/shared/          Tipos y esquemas de validación compartidos
└── apps/
    ├── api/                  Node + Express + Prisma + SQLite
    │   ├── prisma/schema.prisma
    │   └── src/
    │       ├── config/       Validación de variables de entorno
    │       ├── lib/          Errores, cliente de Prisma, sesión, caché
    │       ├── middleware/   Validación, autenticación, manejo de errores
    │       ├── routes/       Definición de rutas
    │       ├── controllers/  Traducción HTTP ↔ dominio
    │       ├── services/     Lógica de negocio
    │       ├── repositories/ Único punto que habla con la base de datos
    │       └── tests/
    └── web/                  React + Vite
        └── src/
            ├── styles/       Tokens de diseño
            ├── lib/          Cliente de API y validación
            ├── components/   UI reutilizable y layout
            ├── features/     auth · pokedex · collection
            └── routes/       Guardas de rutas
```

**La regla que estructura todo:** cada capa habla solo con la de abajo. Un
componente de React nunca hace `fetch`; llama a un hook, que llama a la capa
`api`. Un controlador de Express nunca toca Prisma; llama a un servicio, que
llama a un repositorio.

### El paquete compartido

`@pokedex/shared` contiene los tipos y los **esquemas de Zod** que usan ambos
lados. El mismo `loginSchema` valida el formulario en el navegador y el endpoint
en el servidor: las reglas se escriben una sola vez. El navegador da respuesta
inmediata y el servidor vuelve a validar, porque nunca se confía en el cliente.

---

## API

Todas las rutas cuelgan de `/api`. Los errores comparten una única forma:
`{ "error": { "message": string, "fields"?: Record<string, string> } }`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Comprobación de vida |
| `POST` | `/auth/register` | Crear cuenta e iniciar sesión |
| `POST` | `/auth/login` | Iniciar sesión |
| `POST` | `/auth/logout` | Cerrar sesión |
| `GET` | `/auth/me` | Usuario de la sesión actual |
| `GET` | `/pokemon` | Listado con `search`, `type`, `page`, `pageSize` |
| `GET` | `/pokemon/types` | Tipos disponibles para el filtro |
| `GET` | `/pokemon/:idOrName` | Detalle de un Pokémon |
| `GET` | `/collection` | Colección con `search`, `type`, `favorite`, `sort` |
| `GET` | `/collection/stats` | Resumen de la colección |
| `POST` | `/collection` | Capturar un Pokémon |
| `PATCH` | `/collection/:id` | Editar apodo, notas o favorito |
| `DELETE` | `/collection/:id` | Eliminar de la colección |
| `GET` | `/analysis/status` | Si el análisis con IA está activo y cuánto cupo queda |
| `POST` | `/analysis` | Genera (o reutiliza) el análisis de la colección |

Las rutas de `/collection` y `/analysis` requieren sesión y devuelven `401` sin
ella.

---

## Análisis con IA (opcional)

Es la funcionalidad bonus del enunciado: **análisis inteligente de la colección**.
Manda las estadísticas de tu colección a Claude y devuelve puntos fuertes,
carencias y qué Pokémon te vendría bien capturar, con el motivo de cada uno.

### Cómo activarlo

1. Crea tu propia clave en <https://console.anthropic.com> → **API Keys**.
   Es de pago por uso; una llamada de estas cuesta céntimos.
2. Añádela a `apps/api/.env`:

   ```
   ANTHROPIC_API_KEY="sk-ant-..."
   ```

3. Reinicia la API. El panel aparecerá activo en «Mi colección».

Sin ese paso, el panel muestra un mensaje explicando cómo activarlo y **no se
hace ninguna llamada externa**. El resto de la aplicación es idéntico.

### Este repositorio no contiene ninguna clave

Es un repositorio público, así que la premisa es que **cada quien usa la suya**:

- `apps/api/.env` está en `.gitignore` y nunca se sube.
- `.env.example` solo lleva marcadores, ningún valor real.
- La clave la lee únicamente el servidor. Nunca se envía al navegador, no aparece
  en ninguna respuesta de la API, y si la llamada a Anthropic falla, el detalle se
  registra en el servidor mientras al cliente le llega un mensaje genérico.
- `npm run setup` genera un **`JWT_SECRET` aleatorio** en cada instalación. El
  valor del `.env.example` es un marcador: si se usara tal cual, estaría publicado
  en este repositorio y cualquiera podría firmarse un token de sesión válido.

### Qué impide que abusen del endpoint

La preocupación es concreta: cada llamada gasta dinero de la clave de quien
ejecute el proyecto. Las defensas, de fuera hacia dentro:

| Defensa | Qué evita |
| --- | --- |
| Apagado sin clave | Quien clona el repositorio no gasta nada sin querer |
| Requiere sesión | El endpoint no queda abierto a cualquiera que llegue a la URL |
| `POST`, no `GET` | Que un navegador precargando enlaces dispare análisis |
| Límite por usuario y día | Que una sola cuenta lo use en bucle |
| Límite global y día | Que registrarse en masa dispare la factura |
| Caché por estado de la colección | Pulsar el botón dos veces sin cambios no cuesta nada |
| Recorte de entrada | Acota lo que se manda: 60 entradas y 200 caracteres por campo |
| Devolución de cupo | Un intento que falla no le gasta el cupo al usuario |

Los dos límites se ajustan en el `.env` (`AI_LIMITE_POR_USUARIO_AL_DIA` y
`AI_LIMITE_GLOBAL_AL_DIA`).

### Los datos del usuario son datos, no instrucciones

El apodo y las notas los escribe el usuario y acaban dentro del prompt. Eso es una
vía de inyección de prompt, así que la colección viaja como JSON dentro de una
etiqueta `<coleccion>` y las instrucciones del sistema dicen explícitamente que
todo lo que hay ahí dentro son datos: si un apodo dice «ignora lo anterior», es el
nombre que alguien le puso a su Pokémon y se trata como tal. Hay un test que
comprueba que ese aviso sigue en el prompt.

### Detalles técnicos

- Modelo: `claude-opus-5`, vía el SDK oficial `@anthropic-ai/sdk`.
- **Salida estructurada** con `messages.parse()` y un esquema de Zod, así que la
  respuesta llega ya validada y tipada en lugar de como texto que haya que
  interpretar a mano.
- Los tests **no llaman a la API real**: está sustituida por un doble. Ejecutar la
  suite no cuesta dinero ni necesita clave.

---

## Decisiones técnicas

### SQLite en lugar de PostgreSQL
Quien evalúa el proyecto solo tiene que ejecutar `npm run setup`. Con Postgres
haría falta un servidor corriendo o Docker. Prisma abstrae el motor, así que
migrar a Postgres sería cambiar dos líneas del `schema.prisma`.

### La PokéAPI se consume desde el backend, no desde el navegador
Permite cachear las respuestas, normalizarlas (la PokéAPI devuelve JSON muy
grande y anidado) y resolver la búsqueda. El frontend recibe justo lo que pinta
y depende de una sola API en vez de dos.

### La caché agrupa peticiones simultáneas
`TtlCache` guarda también las promesas en vuelo, no solo los resultados. Si al
pintar una página 24 tarjetas piden el mismo tipo a la vez, sale **una** petición
y no 24.

### Datos duplicados en la colección
Al capturar un Pokémon se copian su nombre, tipos y total de estadísticas
en la fila. Es una desnormalización deliberada: la colección se ve completa
aunque la PokéAPI esté caída, y listarla no dispara una petición externa por
tarjeta. El precio es que esos datos no se actualizan si cambian en el origen,
algo que en la práctica no ocurre.

### JWT en cookie `httpOnly`, no en `localStorage`
`localStorage` lo lee cualquier script de la página, así que un XSS se lleva la
sesión. La cookie `httpOnly` es invisible para JavaScript. El coste es cuidar el
CSRF, y de eso se encarga `sameSite: 'lax'`.

### Sin CORS: el proxy de Vite
El navegador siempre habla con su propio origen (`localhost:5173`) y Vite reenvía
`/api` al backend. Para el navegador todo es la misma aplicación, así que la
cookie viaja sola y no hay CORS que configurar.

### El orden alfabético usa el nombre que se ve
SQL solo puede ordenar por el nombre de la especie, así que un Pokémon apodado
"Psico" aparecía colocado como "mewtwo": para quien mira la lista, desordenada.
Se reordena en memoria por el nombre mostrado, con `localeCompare` en español.

### Los filtros de Explorar viven en la URL
Una búsqueda se puede compartir y guardar en marcadores, el botón "atrás"
funciona y recargar no pierde el contexto. **El retardo antifrenesí se aplica a
la consulta, no a la URL**: así la URL es la única fuente de verdad y no hay que
sincronizar estado en dos direcciones.

### No se reintentan los errores 4xx
Un 404 no se arregla repitiendo la petición. Además `networkMode: 'always'`
evita que React Query pause los reintentos cuando el navegador se cree sin
conexión, cosa que dejaba consultas cargando indefinidamente sin avisar.

---

## Pruebas

```bash
npm test
```

47 tests del backend con Vitest y Supertest, cubriendo autenticación, aislamiento
entre usuarios, CRUD de la colección, estadísticas, normalización de la PokéAPI,
caché, paginación, los límites de uso y el endpoint de análisis con IA.

Los tests **no tocan internet**: `fetch` está sustituido por un doble. Un test
que depende de un servicio externo falla algún día sin que hayas cambiado nada, y
además castiga a una API pública gratuita. Usan su propio archivo SQLite y vacían
las tablas entre casos, así que ninguno depende del anterior.

---

## Tecnologías

**Backend:** Node.js · TypeScript · Express 5 · Prisma · SQLite · Zod · bcrypt ·
JWT · Anthropic SDK · Vitest · Supertest

**Frontend:** React 19 · TypeScript · Vite · React Router · TanStack Query ·
CSS Modules · Material Design Icons (`@mdi/react`)

**Herramientas:** npm workspaces · ESLint · TypeScript en modo estricto
