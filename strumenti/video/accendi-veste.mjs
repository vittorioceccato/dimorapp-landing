// Accende la veste nuova nelle scene dei video, in una COPIA dell'app (mai nel repository di lavoro).
//
//     node strumenti/video/accendi-veste.mjs <cartella della copia>
//
// 1. La cornice delle scene (scena/Scena.tsx e scena/canone/Canone.tsx) prende data-veste="nuova", e la radice
//    pure (le finestre che si aprono in fondo al documento prendono i colori dalla radice, come nell'app).
// 2. I colori scritti a mano nelle scene (la veste di prima) diventano i colori della veste: le stesse variabili che
//    l'app ridefinisce dentro [data-veste="nuova"]. I componenti veri dell'app non si toccano.
import fs from 'node:fs';
import path from 'node:path';

const copia = process.argv[2];
if (!copia || !fs.existsSync(path.join(copia, 'scripts/novita-video/scena'))) {
  console.error('Uso: node strumenti/video/accendi-veste.mjs <cartella della copia dell\'app>');
  process.exit(1);
}
if (fs.existsSync(path.join(copia, '.git'))) {
  console.error('La cartella ha un .git: questo si fa su una copia esportata, non sul repository di lavoro.');
  process.exit(1);
}

const COLORI = [
  ['#1C3A2E', 'var(--c-testo)'],
  ['#55655B', 'var(--c-secondario)'],
  ['#8A9C91', 'var(--c-etichetta)'],
  ['#CFDACE', 'var(--c-bordo)'],
  ['#2E6E4E', 'var(--c-principale)'],
  ['#F2F5F0', 'var(--c-fondo)'],
  ['#E7ECE6', 'var(--c-fondo-tenue)'],
];

const scene = ['scripts/novita-video/scena/Scena.tsx', 'scripts/novita-video/scena/canone/Canone.tsx']
  .map((f) => path.join(copia, f)).filter((f) => fs.existsSync(f));

for (const f of scene) {
  let s = fs.readFileSync(f, 'utf8');
  for (const [vecchio, nuovo] of COLORI) s = s.split(vecchio).join(nuovo);
  s = s.replace(/\bbg-white\b/g, 'bg-[var(--c-scheda)]');
  // La cornice: il primo <div className="... min-h-screen ..."> della scena.
  s = s.replace(/<div className="flex min-h-screen/, '<div data-veste="nuova" className="flex min-h-screen');
  if (!s.includes('data-veste="nuova"')) s = s.replace(/<div className="min-h-screen/, '<div data-veste="nuova" className="min-h-screen');
  // La radice, subito al montaggio.
  if (!s.includes("dataset.veste = 'nuova'")) {
    s = s.replace(/(export default function \w+\([^)]*\)[^{]*\{)/, "$1\n  if (typeof document !== 'undefined') document.documentElement.dataset.veste = 'nuova'");
  }
  fs.writeFileSync(f, s);
  console.log('veste nuova:', path.relative(copia, f), s.includes('data-veste="nuova"') ? '' : '(cornice non trovata: guardala a mano)');
}
