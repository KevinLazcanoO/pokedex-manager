import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

// Crea apps/api/.env a partir del ejemplo. El .env no viaja en el repositorio
// (lleva secretos), así que en una copia recién clonada no existe.
const ejemplo = 'apps/api/.env.example';
const destino = 'apps/api/.env';

if (existsSync(destino)) {
  console.log(`${destino} ya existe, se conserva tal cual.`);
  process.exit(0);
}

copyFileSync(ejemplo, destino);

// El valor de JWT_SECRET del ejemplo está publicado en el repositorio: si se
// dejara puesto, cualquiera podría firmarse un token y entrar como quien
// quisiera. Se sustituye por uno aleatorio en cada instalación.
const secreto = randomBytes(48).toString('base64');
const contenido = readFileSync(destino, 'utf8').replace(
  /^JWT_SECRET=.*$/m,
  `JWT_SECRET="${secreto}"`,
);
writeFileSync(destino, contenido);

console.log(`Creado ${destino} con un JWT_SECRET aleatorio.`);
console.log('El análisis con IA queda desactivado hasta que añadas tu ANTHROPIC_API_KEY.');
