// Scrive le parti della landing che vengono dalle storie e le pagine degli articoli, con un comando solo:
//
//     node strumenti/genera-articoli.mjs
//
// Dalla fonte unica strumenti/storie.mjs:
//   · in index.html riempie i blocchi dei tre racconti (<!--RACCONTO-COME-->, <!--RACCONTO-AFFITTO-->,
//     <!--RACCONTO-SECONDA-->), le carte delle novità (<!--CARTE-->), «Ci stiamo lavorando» (<!--IN-ARRIVO-->) e il piè
//     di pagina delle novità (<!--PIEDE-NOVITA-->); il resto della pagina non lo tocca;
//   · scrive novita/<id>.html per ogni storia, con la testata e il piè di pagina presi da index.html così come sono
//     (fra <!--TESTATA--> e <!--/TESTATA-->, <!--PIEDE--> e <!--/PIEDE-->): un posto solo da cambiare.
// La landing resta statica: i file scritti si committano. Si rilancia quando cambia una storia.
// Nessuna dipendenza.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORIE, PARTI, NOVITA_LANDING, IN_ARRIVO, BOLLETTE, DATI, RACCONTI, ORDINE_CARTE, ORIGINE, ISCRIZIONE, indirizzoArticolo } from './storie.mjs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const percorso = (f) => path.join(RADICE, f);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const senzaPunto = (s) => s.replace(/\.$/, '');
const locandina = (id) => `/assets/novita/${id}.webp`;
const locandinaSocial = (id) => `/assets/novita/${id}.jpg`; // per og:image e i dati strutturati: il JPG lo leggono tutti
const video = (id) => `/assets/novita/${id}.mp4`;
const dominio = (u) => new URL(u).hostname.replace(/^www\./, '');

function sostituisci(testo, nome, contenuto) {
  const apre = `<!--${nome}-->`;
  const chiude = `<!--/${nome}-->`;
  const a = testo.indexOf(apre);
  const c = testo.indexOf(chiude);
  if (a < 0 || c < a) throw new Error(`Manca il blocco ${nome} in index.html`);
  return testo.slice(0, a + apre.length) + '\n' + contenuto + '\n' + testo.slice(c);
}
function estrai(testo, nome) {
  const apre = `<!--${nome}-->`;
  const chiude = `<!--/${nome}-->`;
  const a = testo.indexOf(apre);
  const c = testo.indexOf(chiude);
  if (a < 0 || c < a) throw new Error(`Manca il blocco ${nome} in index.html`);
  return testo.slice(a, c + chiude.length);
}

// ── Le parti di index.html ──
// Un passo del racconto: una storia delle novità (con il suo video, che landing.js crea solo quando serve) oppure il
// passo delle bollette (una schermata ferma). Sotto le storie che lo hanno, un dato vero con la fonte piccola.
function passo(id) {
  if (id === BOLLETTE.id) {
    return `        <article class="storia" data-storia="${BOLLETTE.id}" data-immagine="${BOLLETTE.immagine}">
          <figure class="storia-locandina"><img src="${BOLLETTE.immagine}" alt="" width="1280" height="800" loading="lazy" decoding="async"></figure>
          <h3 class="storia-titolo">${esc(BOLLETTE.titolo)}</h3>
          <p>${esc(BOLLETTE.testo)}</p>
        </article>`;
  }
  const s = STORIE.find((x) => x.id === id);
  if (!s) throw new Error(`Storia ${id} non trovata`);
  const d = DATI[id];
  const dato = d ? `
          <p class="storia-dato"><span class="storia-dato-testo">${esc(d.testo)}</span> <span class="storia-dato-fonte">Fonte: <a href="${esc(d.indirizzo)}" rel="noopener">${esc(d.fonte)}</a></span></p>` : '';
  return `        <article class="storia" data-storia="${s.id}">
          <figure class="storia-locandina"><img src="${locandina(s.id)}" alt="" width="960" height="600" loading="lazy" decoding="async"></figure>
          <h3 class="storia-titolo">${esc(s.titolo)}</h3>
          <p>${esc(s.testo)}</p>${dato}
          <a class="collegamento" href="${indirizzoArticolo(s.id)}">${esc(PARTI.leggi)}</a>
        </article>`;
}
const racconto = (ids) => ids.map(passo).join('\n');

// Una carta delle novità: la locandina, e sopra il video piccolo che landing.js crea quando la carta è sullo schermo.
const carta = (s, livello = 3) => `      <article class="carta">
        <div class="carta-media" data-video-carta="${video(s.id)}"><img class="carta-immagine" src="${locandina(s.id)}" alt="" width="960" height="600" loading="lazy" decoding="async"></div>
        <div class="carta-corpo">
          <span class="etichetta">${esc(NOVITA_LANDING.etichetta)}</span>
          <h${livello} class="carta-titolo"><a href="${indirizzoArticolo(s.id)}">${esc(s.titolo)}</a></h${livello}>
          <p>${esc(s.testo)}</p>
          <span class="carta-leggi" aria-hidden="true">${esc(PARTI.leggi)}</span>
        </div>
      </article>`;
const carte = ORDINE_CARTE.map((id) => STORIE.find((s) => s.id === id)).filter((s) => s && s.carta).map((s) => carta(s)).join('\n');

const inArrivo = `    <div class="in-arrivo">
      <h3 class="titolo-mese">${esc(IN_ARRIVO.titolo)}</h3>
      <ul class="in-arrivo-elenco">
${IN_ARRIVO.voci.map((v) => `        <li><span class="in-arrivo-titolo">${esc(v.titolo)}</span> <span class="in-arrivo-testo">${esc(v.testo)}</span></li>`).join('\n')}
      </ul>
    </div>`;

const piedeNovita = STORIE.map((s) => `      <a href="${indirizzoArticolo(s.id)}">${esc(s.titolo)}</a>`).join('\n');

let indice = fs.readFileSync(percorso('index.html'), 'utf8');
indice = sostituisci(indice, 'RACCONTO-COME', racconto(RACCONTI.COME));
indice = sostituisci(indice, 'RACCONTO-AFFITTO', racconto(RACCONTI.AFFITTO));
indice = sostituisci(indice, 'RACCONTO-SECONDA', racconto(RACCONTI.SECONDA));
indice = sostituisci(indice, 'CARTE', carte);
indice = sostituisci(indice, 'IN-ARRIVO', inArrivo);
indice = sostituisci(indice, 'PIEDE-NOVITA', piedeNovita);
fs.writeFileSync(percorso('index.html'), indice);

const TESTATA = estrai(indice, 'TESTATA');
const PIEDE = estrai(indice, 'PIEDE');

// ── Le pagine degli articoli ──
function pagina(s) {
  const a = s.articolo;
  const canonico = ORIGINE + indirizzoArticolo(s.id);
  const titoloPagina = `${senzaPunto(s.titolo)} | Novità di Dimora`;
  const immagine = ORIGINE + locandinaSocial(s.id);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: s.titolo,
    description: a.rigaSotto,
    image: [immagine],
    datePublished: s.uscita,
    dateModified: s.uscita,
    inLanguage: 'it',
    mainEntityOfPage: canonico,
    author: { '@type': 'Organization', name: 'Il team di Dimora', url: ORIGINE },
    publisher: { '@type': 'Organization', '@id': `${ORIGINE}/#organizzazione`, name: 'Dimora', logo: { '@type': 'ImageObject', url: `${ORIGINE}/favicon.svg` } },
  };
  const fonti = a.fonti.map((f) => {
    const link = f.indirizzi.map((u) => `<a href="${esc(u)}" rel="noopener">${esc(dominio(u))}</a>`).join(', ');
    return `          <li>${esc(f.titolo)}${link ? ` (${link})` : ''}</li>`;
  }).join('\n');
  const altre = STORIE.filter((x) => x.id !== s.id).map((x) => carta(x, 3).replace(/^ {6}/gm, '        ')).join('\n');

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  try { if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('vivo'); } catch (e) {}
</script>
<title>${esc(titoloPagina)}</title>
<meta name="description" content="${esc(a.rigaSotto)}">
<link rel="canonical" href="${canonico}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#FAF3E3">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Dimora">
<meta property="og:locale" content="it_IT">
<meta property="og:url" content="${canonico}">
<meta property="og:title" content="${esc(s.titolo)}">
<meta property="og:description" content="${esc(a.rigaSotto)}">
<meta property="og:image" content="${immagine}">
<meta property="og:image:width" content="960">
<meta property="og:image:height" content="600">
<meta property="og:image:type" content="image/jpeg">
<meta property="article:published_time" content="${s.uscita}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(s.titolo)}">
<meta name="twitter:description" content="${esc(a.rigaSotto)}">
<meta name="twitter:image" content="${immagine}">
<link rel="preload" href="/assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/fraunces-600-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/veste.css">
<link rel="stylesheet" href="/assets/landing.css">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
</head>
<body class="pagina-articolo">
<a class="salta" href="#contenuto">Vai al contenuto</a>

${TESTATA}

<main id="contenuto">
  <article class="articolo" data-articolo="${s.id}">
    <div class="contenitore contenitore-articolo">
      <a class="indietro" href="/#novita"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Tutte le novità</a>
      <span class="etichetta">${esc(NOVITA_LANDING.etichetta)}</span>
      <h1 class="articolo-titolo">${esc(s.titolo)}</h1>
      <p class="articolo-sotto">${esc(a.rigaSotto)}</p>
    </div>
    <div class="contenitore contenitore-video">
      <figure class="finestra finestra-articolo" aria-hidden="true">
        <div class="finestra-barra"><span class="finestra-punti"><i></i><i></i><i></i></span><span class="finestra-indirizzo">app.dimorapp.com</span></div>
        <div class="finestra-schermo">
          <img class="schermo-locandina" src="${locandina(s.id)}" alt="" width="960" height="600" decoding="async" fetchpriority="high">
          <video class="schermo-video" data-video-articolo data-src="${video(s.id)}" width="960" height="600" muted loop playsinline preload="none" disablepictureinpicture></video>
        </div>
      </figure>
    </div>
    <div class="contenitore contenitore-articolo articolo-corpo">
      <h2>${esc(PARTI.perche)}</h2>
${a.perche.map((p) => `      <p>${esc(p)}</p>`).join('\n')}
      <h2>${esc(PARTI.passi)}</h2>
      <ol class="articolo-passi">
${a.passi.map((p) => `        <li>${esc(p)}</li>`).join('\n')}
      </ol>
      <h2>${esc(PARTI.alComando)}</h2>
      <p>${esc(a.alComando)}</p>
      <div class="articolo-azione">
        <a class="btn btn-principale btn-grande" href="${ISCRIZIONE}" data-evento="clic_inizia_prova" data-posizione="articolo_${s.id.replace(/-/g, '_')}">${esc(PARTI.azione)}</a>
        <p class="apertura-nota">30 giorni, 20 letture con l'AI, senza carta.</p>
      </div>
      <p class="articolo-firma">${esc(PARTI.firma)}</p>
${a.fonti.length ? `      <section class="articolo-fonti" aria-labelledby="fonti-titolo">
        <h2 id="fonti-titolo">${esc(PARTI.fonti)}</h2>
        <ul>
${fonti}
        </ul>
      </section>` : `      <p class="articolo-fonti articolo-senza-fonti">${esc(a.senzaFonti)}</p>`}
    </div>
  </article>

  <section class="sezione altre-novita" aria-labelledby="altre-titolo">
    <div class="contenitore">
      <h2 class="titolo-sezione" id="altre-titolo">${esc(NOVITA_LANDING.titolo)}</h2>
      <div class="carte">
${altre}
      </div>
    </div>
  </section>
</main>

${PIEDE}

<script src="/assets/landing.js" defer></script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(percorso('novita'), { recursive: true });
for (const s of STORIE) fs.writeFileSync(percorso(`novita/${s.id}.html`), pagina(s));

// ── La mappa del sito: la landing e gli articoli ──
const oggi = new Date().toISOString().slice(0, 10);
const mappa = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${ORIGINE}/</loc>
    <lastmod>${oggi}</lastmod>
  </url>
${STORIE.map((s) => `  <url>
    <loc>${ORIGINE}${indirizzoArticolo(s.id)}</loc>
    <lastmod>${oggi}</lastmod>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(percorso('sitemap.xml'), mappa);

console.log(`Scritti: index.html (racconti ${RACCONTI.COME.length}+${RACCONTI.AFFITTO.length}+${RACCONTI.SECONDA.length}, carte ${carte.split('<article').length - 1}), ${STORIE.length} articoli, sitemap.xml`);
