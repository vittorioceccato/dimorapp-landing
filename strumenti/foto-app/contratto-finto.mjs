// Un foglio di contratto INVENTATO (nessun dato vero), per la conferma della lettura nella landing.
// node contratto-finto.mjs <sharp-dir> <uscita.webp>
import { createRequire } from 'node:module';
const [dir, out] = process.argv.slice(2);
const sharp = createRequire(dir + '/package.json')('sharp');
const righe = [
  ['CONTRATTO DI LOCAZIONE AD USO ABITATIVO', 34, 'bold', 'middle'],
  ['(art. 2, comma 1, della legge 9 dicembre 1998, n. 431)', 22, 'normal', 'middle'],
  ['', 22],
  ['Il signor Mario Rossi, di seguito «locatore»,', 24],
  ['concede in locazione alla signora Giulia Conti, di seguito', 24],
  ['«conduttore», che accetta, l’unità immobiliare posta in', 24],
  ['Verona, via Mazzini 7, piano secondo, composta da due vani', 24],
  ['oltre cucina e servizi.', 24],
  ['', 22],
  ['Art. 1 — Durata', 26, 'bold'],
  ['Il contratto è stipulato per la durata di anni quattro, dal', 24],
  ['1° luglio 2023 al 30 giugno 2027, e si rinnova per altri', 24],
  ['quattro anni salvo disdetta del locatore.', 24],
  ['', 22],
  ['Art. 2 — Canone', 26, 'bold'],
  ['Il canone annuo è convenuto in euro 7.800, da pagarsi in', 24],
  ['dodici rate mensili di euro 650 entro il giorno 5 di ogni', 24],
  ['mese, mediante bonifico bancario.', 24],
  ['', 22],
  ['Art. 3 — Deposito cauzionale', 26, 'bold'],
  ['A garanzia degli obblighi il conduttore versa la somma di', 24],
  ['euro 1.300, pari a due mensilità del canone.', 24],
  ['', 22],
  ['Art. 4 — Regime fiscale', 26, 'bold'],
  ['Il locatore dichiara di optare per la cedolare secca.', 24],
  ['', 22],
  ['Verona, 20 giugno 2023', 24],
  ['', 22],
  ['Il locatore                                   Il conduttore', 24],
];
let y = 130;
const testo = righe.map(([t, s = 24, w = 'normal', a = 'start']) => {
  const x = a === 'middle' ? 620 : 110;
  const r = t ? `<text x="${x}" y="${y}" font-family="Georgia, serif" font-size="${s}" font-weight="${w}" text-anchor="${a}" fill="#2a2a2a">${t.replace(/&/g, '&amp;')}</text>` : '';
  y += s + 22;
  return r;
}).join('');
const firme = `<path d="M150 ${y + 10} c30 -30 60 20 90 -10 s50 15 80 -5" stroke="#2d3b6b" stroke-width="3" fill="none"/><path d="M820 ${y + 10} c25 -25 50 18 80 -8 s45 12 75 -4" stroke="#2d3b6b" stroke-width="3" fill="none"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754"><rect width="1240" height="1754" fill="#fdfcf8"/>${testo}${firme}</svg>`;
await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(out);
console.log('ok', out);
