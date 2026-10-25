// Controllo della landing (veste nuova, 25/10/2026), con un comando solo e nessuna dipendenza:
//
//     node controlli/controllo.mjs
//
// Legge dal disco la pagina, gli articoli, gli stili e lo script, e verifica:
//   1. i file ci sono: le pagine degli articoli per ogni storia, i video e le locandine, i caratteri;
//   2. la veste: colori e misure stanno SOLO in assets/veste.css, coi valori dell'app (commit scritto in cima);
//      landing.css non scrive colori; nell'HTML gli unici colori sono quelli dei disegni delle case;
//   3. le storie: racconto, carte, piè di pagina e articoli coincidono con strumenti/storie.mjs (parola per parola),
//      e negli articoli pubblici non c'è l'azione dell'app né l'etichetta personale;
//   4. prezzi, prova e pacchetti coincidono con la tabella qui sotto; le domande frequenti sono dieci, nel loro ordine;
//   5. le risorse caricate vengono solo dal sito stesso (più lo script delle statistiche di Vercel, a quel percorso);
//      nessuno script di terzi, nessun tag di Google, nessun cookie scritto dallo script;
//   6. i collegamenti vanno solo all'app (login, termini, privacy), alle pagine e sezioni che esistono, al mailto
//      dell'assistenza e alle fonti degli articoli; ogni «Prova gratis» porta all'iscrizione di oggi;
//   7. Google: un titolo, una descrizione, una canonica per pagina; i dati strutturati si leggono; la mappa del sito ha
//      la landing e gli articoli e nient'altro; robots.txt la indica; vercel.json pulisce gli indirizzi;
//   8. le animazioni: si accendono solo senza «meno animazioni», e senza script la pagina è completa
//      (casa disegnata, immagini delle storie, numeri al loro valore); i video partono solo dallo script.
// Esce con 1 se un controllo fallisce, dopo averli stampati tutti.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORIE, PARTI, NOVITA_LANDING, ORIGINE, ISCRIZIONE, indirizzoArticolo } from '../strumenti/storie.mjs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leggi = (f) => fs.readFileSync(path.join(RADICE, f), 'utf8');
const esiste = (f) => fs.existsSync(path.join(RADICE, f));

let falliti = 0, passati = 0;
function verifica(cond, nome, dettaglio) {
  if (cond) passati++; else { falliti++; console.log(`  ✗ ${nome}${dettaglio ? ' — ' + dettaglio : ''}`); }
}
const sezione = (t) => console.log(t);

const entita = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const testo = (html) => entita(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attributi = (html, nome) => [...html.matchAll(new RegExp(`\\s${nome}="([^"]*)"`, 'g'))].map((m) => entita(m[1]));

const HTML = leggi('index.html');
const VESTE = leggi('assets/veste.css');
const CSS = leggi('assets/landing.css');
const JS = leggi('assets/landing.js');
const ARTICOLI = Object.fromEntries(STORIE.map((s) => [s.id, esiste(`novita/${s.id}.html`) ? leggi(`novita/${s.id}.html`) : '']));
const PAGINE = { '/': HTML, ...Object.fromEntries(STORIE.map((s) => [indirizzoArticolo(s.id), ARTICOLI[s.id]])) };

/* ---------- 1. I file ---------- */
sezione('1. I file');
for (const f of ['assets/veste.css', 'assets/landing.css', 'assets/landing.js', 'assets/fonts/fraunces-600-latin.woff2', 'assets/fonts/fraunces-600-latin-ext.woff2', 'assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2', 'assets/img/dimorino-cartelle.webp', 'assets/img/quaderno.jpg', 'favicon.svg', 'dimora-og-2026-10.jpg', 'robots.txt', 'sitemap.xml', 'vercel.json']) verifica(esiste(f), `c'è ${f}`);
for (const s of STORIE) {
  verifica(!!ARTICOLI[s.id], `c'è la pagina novita/${s.id}.html`);
  for (const e of ['mp4', 'jpg', 'webp']) {
    const f = `assets/novita/${s.id}.${e}`;
    verifica(esiste(f), `c'è ${f}`);
    if (e === 'mp4' && esiste(f)) verifica(fs.statSync(path.join(RADICE, f)).size < 1_000_000, `${f} pesa meno di 1 MB`);
  }
}
for (const vecchio of ['assets/stile.css', 'assets/pagina.js']) verifica(!esiste(vecchio), `${vecchio} non c'è più`);

/* ---------- 2. La veste ---------- */
sezione('2. La veste');
verifica(/commit 8a568fa/.test(VESTE.slice(0, 600)), "veste.css dice in cima da quale commit dell'app viene");
// I valori della colonna nuova di app/globals.css (commit 8a568fa).
const COMPITI = {
  '--c-fondo': '#FAF3E3', '--c-scheda': '#FFFDF8', '--c-fondo-tenue': '#F6EEDC', '--c-riga': '#E0D2B6', '--c-bordo': '#E0D2B6',
  '--c-bordo-campo': '#8C8470', '--c-testo': '#27302A', '--c-secondario': '#40453C', '--c-etichetta': '#5A5E54',
  '--c-principale': '#20603D', '--c-principale-ombra': '#174A2F', '--c-su-scuro': '#FFFDF8', '--c-stato-fondo': '#E6EFE7',
  '--c-stato-testo': '#20603D', '--c-esito-fondo': '#E6EFE7', '--c-ritardo': '#8F1818', '--c-accento': '#CE7F33',
  '--c-avviso-fondo': '#FBE3C4', '--c-avviso-testo': '#6B3D0C',
  '--text-piccolo': '14px', '--text-minimo': '13px', '--text-sezione': '17px', '--radius-veste': '14px', '--m-corpo': '16px',
};
for (const [k, v] of Object.entries(COMPITI)) verifica(new RegExp(`${k}:\\s*${v}\\s*;`, 'i').test(VESTE), `veste.css: ${k} = ${v}`);
verifica(/@media \(min-width: 64rem\)\s*\{\s*:root\s*\{\s*--m-corpo:\s*15px/.test(VESTE), "il corpo è 15 px dal computer, come nell'app");
verifica(/font-family: 'Fraunces';\s*font-style: normal;\s*font-weight: 600;/.test(VESTE), 'Fraunces nel solo peso 600');
const cssSenzaCommenti = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
verifica(!/#[0-9a-f]{3,8}\b/i.test(cssSenzaCommenti), 'landing.css non scrive colori esadecimali', (cssSenzaCommenti.match(/#[0-9a-f]{3,8}\b/gi) || []).join(' '));
verifica(!/\brgba?\(|\bhsla?\(|\boklch\(/i.test(cssSenzaCommenti), 'landing.css non scrive colori rgb/hsl/oklch');
verifica(!/font-family:(?!\s*var\()/i.test(cssSenzaCommenti), 'landing.css usa solo i caratteri della veste');
for (const [p, h] of Object.entries(PAGINE)) {
  const colori = new Set((h.match(/#[0-9A-Fa-f]{6}\b/g) || []).map((c) => c.toUpperCase()));
  const ammessi = new Set(['#27302A', '#CE7F33', '#F6EEDC', '#FAF3E3']); // il tratto, la porta, il fondo dei disegni; il colore del tema
  verifica([...colori].every((c) => ammessi.has(c)), `${p}: nell'HTML solo i colori dei disegni delle case`, [...colori].filter((c) => !ammessi.has(c)).join(' '));
  verifica(!/\sstyle="[^"]*(color|background)/.test(h), `${p}: nessuno stile in linea con colori`);
}
// Il disegno della casa in apertura è il sorgente «casa» della regia, così com'è (aggiunti solo pathLength e l'ordine del tratto).
for (const d of ['M40 100V52q0-8 8-8h6', 'M72 50l34-26 34 26', 'M100 100V86a6 6 0 0 1 12 0v14z', 'M10 100h200']) verifica(HTML.includes(`d="${d}"`), `la casa dell'apertura ha il tratto ${d}`);
verifica(/x="78" y="48" width="56" height="52"/.test(HTML) && /x="134" y="58" width="40" height="42"/.test(HTML), "la casa dell'apertura ha i suoi due corpi");
verifica(/class="casa-porta"[^>]*fill="#CE7F33"/.test(HTML), 'la porta ha il tocco ambra');

/* ---------- 3. Le storie ---------- */
sezione('3. Le storie');
const racconto = HTML.slice(HTML.indexOf('<!--RACCONTO-->'), HTML.indexOf('<!--/RACCONTO-->'));
const idRacconto = attributi(racconto, 'data-storia');
verifica(JSON.stringify(idRacconto) === JSON.stringify(['imu-calcolata', 'rate-condominio', 'carichi-al-resto', 'pacchetto-commercialista', 'bonus-casa', 'canone-a-meta']), 'il racconto: IMU, condominio, caricamento, commercialista, bonus, canone', idRacconto.join(', '));
const testoRacconto = testo(racconto);
for (const s of STORIE) {
  verifica(testoRacconto.includes(s.titolo) && testoRacconto.includes(s.testo), `racconto: «${s.titolo}» col suo testo breve`);
  verifica(racconto.includes(`href="${indirizzoArticolo(s.id)}"`), `racconto: «${s.titolo}» porta al suo articolo`);
}
const carte = HTML.slice(HTML.indexOf('<!--CARTE-->'), HTML.indexOf('<!--/CARTE-->'));
const testoCarte = testo(carte);
const conCarta = STORIE.filter((s) => s.carta);
verifica((carte.match(/class="carta"/g) || []).length === conCarta.length, `le carte di ottobre sono ${conCarta.length}`);
for (const s of conCarta) verifica(testoCarte.includes(s.titolo) && testoCarte.includes(s.testo) && carte.includes(`href="${indirizzoArticolo(s.id)}"`), `carta: «${s.titolo}»`);
verifica(testoCarte.split(NOVITA_LANDING.etichetta).length - 1 === conCarta.length, 'ogni carta dice «Nuovo · ottobre 2026»');
verifica(testo(HTML).includes(NOVITA_LANDING.titolo) && testo(HTML).includes(NOVITA_LANDING.testo), 'la sezione delle novità ha N26 e N27');
for (const s of STORIE) {
  const h = ARTICOLI[s.id];
  if (!h) continue;
  const corpo = testo(h.slice(h.indexOf('<main'), h.indexOf('</main>')));
  const a = s.articolo;
  const chiusa = a.fonti.length ? PARTI.fonti : a.senzaFonti;
  verifica(a.fonti.length > 0 || /^Senza fonti: /.test(a.senzaFonti || ''), `articolo ${s.id}: le fonti, o la riga «Senza fonti»`);
  const attesi = [s.titolo, a.rigaSotto, PARTI.perche, ...a.perche, PARTI.passi, ...a.passi, PARTI.alComando, a.alComando, PARTI.firma, chiusa, PARTI.azione, ...a.fonti.map((f) => f.titolo)];
  const mancanti = attesi.filter((t) => !corpo.includes(t));
  verifica(mancanti.length === 0, `articolo ${s.id}: tutti i testi, parola per parola`, mancanti.map((m) => m.slice(0, 50)).join(' | '));
  verifica(!/Nota interna/.test(corpo), `articolo ${s.id}: niente note interne della regia`);
  for (const f of a.fonti) for (const u of f.indirizzi) verifica(h.includes(`href="${u}"`), `articolo ${s.id}: la fonte ${new URL(u).hostname} ha il collegamento`);
  const ordine = [a.rigaSotto, PARTI.perche, PARTI.passi, PARTI.alComando, PARTI.azione, PARTI.firma, chiusa].map((t) => corpo.indexOf(t));
  verifica(ordine.every((x, i) => i === 0 || x > ordine[i - 1]), `articolo ${s.id}: le parti nel loro ordine`);
  for (const via of ['Guarda la tua IMU', 'Prepara il pacchetto', 'Carica un preventivo', 'Carica il preventivo', 'Vai agli incassi', 'saldo stimato']) verifica(!corpo.includes(via), `articolo ${s.id}: niente «${via}» dell'app`);
  verifica(h.includes(`href="${ISCRIZIONE}"`) && h.includes('data-evento="clic_inizia_prova"'), `articolo ${s.id}: «Prova Dimora gratis» porta all'iscrizione`);
  verifica(h.includes('<!--TESTATA-->') && h.includes('<!--PIEDE-->'), `articolo ${s.id}: testata e piè di pagina della landing`);
  verifica(h.includes(`data-src="/assets/novita/${s.id}.mp4"`) && h.includes(`src="/assets/novita/${s.id}.webp"`) && h.includes(`content="${ORIGINE}/assets/novita/${s.id}.jpg"`), `articolo ${s.id}: il suo video e la sua locandina`);
  verifica(!/<video[^>]*\sautoplay/.test(h) && !/<video[^>]*\ssrc=/.test(h), `articolo ${s.id}: il video non parte e non si scarica senza lo script`);
}
const piede = HTML.slice(HTML.indexOf('<!--PIEDE-NOVITA-->'), HTML.indexOf('<!--/PIEDE-NOVITA-->'));
verifica(STORIE.every((s) => piede.includes(`href="${indirizzoArticolo(s.id)}"`)), 'il piè di pagina porta a tutti gli articoli');

/* ---------- 4. Prezzi e domande (testi di oggi, corretti il 22/10) ---------- */
sezione('4. Prezzi e domande');
const PIANI = {
  'Dimora':      { anno: '59 €',  mese: '6,90 €',  immobili: 3,  letture: 20, gb: 5,  regalo: 20, risparmio: '23,80 €' },
  'Dimora Plus': { anno: '119 €', mese: '12,90 €', immobili: 10, letture: 40, gb: 10, regalo: 40, risparmio: '35,80 €' },
  'Dimora Max':  { anno: '219 €', mese: '22,90 €', immobili: 25, letture: 80, gb: 20, regalo: 80, risparmio: '55,80 €' },
};
const cent = (s) => { const m = /^(\d+)(?:,(\d{2}))? €$/.exec(s); return +m[1] * 100 + +(m[2] || 0); };
for (const [nome, p] of Object.entries(PIANI)) {
  const i = HTML.indexOf(`data-piano="${nome}"`);
  const scheda = testo(HTML.slice(i, HTML.indexOf('</article>', i)));
  for (const t of [p.anno, p.mese, `Fino a ${p.immobili} immobili`, `${p.letture} letture AI al mese`, `${p.gb} GB di archivio`, `${p.regalo} letture AI in più`, `Con l'annuale risparmi ${p.risparmio}`]) verifica(scheda.includes(t), `${nome}: «${t}»`);
  verifica(cent(p.mese) * 12 - cent(p.anno) === cent(p.risparmio), `${nome}: il risparmio è dodici mesi meno l'annuale`);
}
const risparmioMax = Math.max(...Object.values(PIANI).map((p) => (cent(p.mese) * 12 - cent(p.anno)) / (cent(p.mese) * 12)));
verifica(testo(HTML).includes(`risparmi fino al ${Math.floor(risparmioMax * 100)}%`), "l'interruttore dice il risparmio massimo, arrotondato per difetto");
verifica(testo(HTML).includes("30 giorni, 20 letture con l'AI e 1 GB di archivio, senza carta e senza addebiti automatici. Tutte le funzioni, senza limite di immobili."), 'la prova gratuita, parola per parola');
verifica(testo(HTML).includes('10 letture a 4,90 €, 20 a 7,90 €, 100 a 34,90 €'), 'i pacchetti');
const DOMANDE = ['Per chi è pensata Dimora?', 'Che cosa succede alla fine della prova?', 'Quanto costa dopo la prova?', 'Come funzionano le letture AI?', 'Posso avere più letture?', 'Quali documenti legge?', 'Quanto può essere lungo un documento?', 'I miei documenti sono al sicuro?', 'Serve installare qualcosa?', 'Posso portare via i miei dati?'];
const domande = [...HTML.matchAll(/<details class="domanda"><summary><h3>([^<]+)<\/h3>/g)].map((m) => entita(m[1]));
verifica(JSON.stringify(domande) === JSON.stringify(DOMANDE), 'le dieci domande nel loro ordine', domande.join(' | '));
verifica(!/<details class="domanda" open/.test(HTML), 'le domande partono chiuse');

/* ---------- 5. Le risorse ---------- */
sezione('5. Le risorse');
const STATISTICHE = '/_vercel/insights/script.js';
for (const [p, h] of Object.entries(PAGINE)) {
  const senzaLink = h.replace(/<a\s[^>]*>/g, '');
  const risorse = [...attributi(senzaLink, 'src'), ...attributi(senzaLink, 'data-src'), ...[...h.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https:\/\/dimorapp\.com\//.test(u))];
  const esterne = risorse.filter((u) => /^(https?:)?\/\//.test(u));
  verifica(esterne.length === 0, `${p}: nessuna risorsa da un altro sito`, esterne.join(' '));
  const mancanti = risorse.filter((u) => u.startsWith('/') && u !== STATISTICHE).map((u) => u.slice(1)).filter((u) => !esiste(u));
  verifica(mancanti.length === 0, `${p}: ogni risorsa è un file del repository`, mancanti.join(' '));
  const script = [...h.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  verifica(JSON.stringify(script) === JSON.stringify(['/assets/landing.js', STATISTICHE]), `${p}: solo landing.js e le statistiche di Vercel`, script.join(' '));
  verifica(!/googletagmanager|google-analytics|gtag\(|fbq\(|hotjar|clarity\.ms/i.test(h), `${p}: nessun tag di terzi`);
}
verifica(!/document\.cookie|localStorage|sessionStorage/.test(JS), 'lo script non scrive cookie né memoria del browser');
verifica(!/\bfetch\(|XMLHttpRequest|sendBeacon/.test(JS), 'lo script non chiama nessun indirizzo');

/* ---------- 6. I collegamenti ---------- */
sezione('6. I collegamenti');
const FONTI = new Set(STORIE.flatMap((s) => s.articolo.fonti.flatMap((f) => f.indirizzi)));
const APP = new Set([ISCRIZIONE, 'https://app.dimorapp.com/termini', 'https://app.dimorapp.com/privacy']);
const SEZIONI = new Set([...HTML.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const [p, h] of Object.entries(PAGINE)) {
  const hrefs = [...h.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => entita(m[1]));
  const strani = hrefs.filter((u) => {
    if (APP.has(u) || FONTI.has(u) || u === 'mailto:assistenza@dimorapp.com' || u === '/') return false;
    if (u.startsWith('/#')) return !SEZIONI.has(u.slice(2));
    if (u.startsWith('#')) return !new RegExp(`\\sid="${u.slice(1)}"`).test(h);
    if (u.startsWith('/novita/')) return !STORIE.some((s) => indirizzoArticolo(s.id) === u);
    return true;
  });
  verifica(strani.length === 0, `${p}: ogni collegamento va dove deve`, strani.join(' '));
  const prova = [...h.matchAll(/<a\s[^>]*>(Prova gratis|Prova Dimora gratis|Inizia la prova gratuita)<\/a>/g)].map((m) => m[0]);
  verifica(prova.length > 0 && prova.every((a) => a.includes(`href="${ISCRIZIONE}"`) && a.includes('data-evento="clic_inizia_prova"')), `${p}: ogni «Prova gratis» porta all'iscrizione di oggi, con il suo evento`);
  const eventi = [...h.matchAll(/data-evento="([^"]+)"\s+data-posizione="([^"]+)"/g)].map((m) => m[1] + '/' + m[2]);
  verifica(eventi.every((e) => /^(clic_inizia_prova|clic_accedi)\//.test(e)), `${p}: solo gli eventi clic_inizia_prova e clic_accedi`);
  verifica(new Set(eventi).size === eventi.length, `${p}: nessuna coppia evento e posizione ripetuta`);
}

/* ---------- 7. Google ---------- */
sezione('7. Google');
for (const [p, h] of Object.entries(PAGINE)) {
  const canoniche = [...h.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
  verifica(canoniche.length === 1 && canoniche[0] === ORIGINE + p, `${p}: una canonica, ${ORIGINE + p}`, canoniche.join(' '));
  verifica((h.match(/<title>/g) || []).length === 1, `${p}: un titolo`);
  const descr = attributi(h.match(/<meta name="description"[^>]*>/)?.[0] || '', 'content')[0] || '';
  verifica(descr.length >= 50 && descr.length <= 170, `${p}: la descrizione fra 50 e 170 caratteri`, String(descr.length));
  verifica(/<meta property="og:image" content="https:\/\/dimorapp\.com\/[^"]+"/.test(h), `${p}: og:image con l'indirizzo intero`);
  verifica((h.match(/<h1[\s>]/g) || []).length === 1, `${p}: un titolo h1`);
  const ld = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let dati = null;
  try { dati = JSON.parse(ld[1]); } catch { /* sotto */ }
  verifica(!!dati, `${p}: i dati strutturati si leggono`);
  if (dati && p !== '/') {
    const s = STORIE.find((x) => indirizzoArticolo(x.id) === p);
    verifica(dati['@type'] === 'Article' && dati.headline === s.titolo && dati.datePublished === s.uscita && dati.mainEntityOfPage === ORIGINE + p, `${p}: Article con titolo, data e indirizzo`);
    verifica(dati.description === s.articolo.rigaSotto && descr === s.articolo.rigaSotto, `${p}: la descrizione è la riga sotto il titolo`);
  }
  if (dati && p === '/') {
    const app = dati['@graph'].find((x) => x['@type'] === 'SoftwareApplication');
    verifica(app && app.description === descr, '/: la descrizione dei dati strutturati è la meta description');
    verifica(!/"offers"|"price"|"aggregateRating"/.test(ld[1]), '/: nessun prezzo, offerta o valutazione nei dati strutturati');
  }
}
const voci = [...leggi('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
verifica(JSON.stringify(voci) === JSON.stringify([ORIGINE + '/', ...STORIE.map((s) => ORIGINE + indirizzoArticolo(s.id))]), "la mappa del sito: la landing e gli articoli, e nient'altro", voci.join(' '));
const altre = fs.readdirSync(RADICE).filter((f) => f.endsWith('.html') && f !== 'index.html');
verifica(altre.length === 0, "nessun'altra pagina alla radice fuori dalla mappa", altre.join(' '));
verifica(/Sitemap: https:\/\/dimorapp\.com\/sitemap\.xml/.test(leggi('robots.txt')), 'robots.txt indica la mappa');
let vercel = {};
try { vercel = JSON.parse(leggi('vercel.json')); } catch { /* sotto */ }
verifica(vercel.cleanUrls === true && vercel.trailingSlash === false, 'vercel.json: indirizzi puliti (/index.html e /novita/x.html rimandano alla canonica)');
const intestazioni = JSON.stringify(vercel.headers || []);
verifica(intestazioni.includes('X-Robots-Tag') && intestazioni.includes('vercel'), 'vercel.json: gli indirizzi *.vercel.app non si indicizzano');
verifica(/^controlli$/m.test(leggi('.vercelignore')) && /^strumenti$/m.test(leggi('.vercelignore')), 'controlli e strumenti non si pubblicano');

/* ---------- 8. Le animazioni ---------- */
sezione('8. Le animazioni');
for (const [p, h] of Object.entries(PAGINE)) {
  const testa = h.slice(0, h.indexOf('</head>'));
  verifica(/prefers-reduced-motion: reduce\)'\)\.matches\) document\.documentElement\.classList\.add\('vivo'\)/.test(testa), `${p}: «vivo» si accende nella testa, solo senza «meno animazioni»`);
}
verifica(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important[\s\S]*transition: none !important/.test(CSS), 'con «meno animazioni» nessuna animazione e nessuna transizione');
const regoleAnimate = (cssSenzaCommenti.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '').match(/[^{}]+\{[^{}]*\banimation:[^{}]*\}/g) || []).map((r) => r.trim());
const fuoriVivo = regoleAnimate.filter((r) => !/^\.vivo\b/.test(r) && !/animation: none/.test(r));
verifica(fuoriVivo.length === 0, 'ogni animazione sta dietro «vivo»', fuoriVivo.map((r) => r.slice(0, 60)).join(' | '));
verifica(CSS.includes('.racconto[data-pronto] .storia-locandina { display: none; }'), 'il racconto nasconde le immagini delle storie solo quando lo script ha preparato la finestra');
verifica((racconto.match(/class="storia-locandina"/g) || []).length === STORIE.length, 'senza script ogni storia ha la sua immagine ferma');
verifica(/data-conta="977">977</.test(HTML) && /data-conta="7894">7\.894</.test(HTML) && /data-conta="45">45</.test(HTML), 'senza script i numeri sono già al loro valore');
verifica(!/<video/.test(HTML), 'nella landing nessun video senza lo script (li crea lui, senza indirizzo finché non servono)');
verifica(JS.includes('if (i === attiva && inVista && !risparmio)') && JS.includes('s.video.pause()'), 'gira solo il video della storia sullo schermo, e solo con il racconto in vista');
verifica(JS.includes("v.preload = 'none'"), 'i video del racconto non si scaricano prima del loro turno');
verifica(!/cursor:\s*(none|url)/.test(CSS), 'nessun cursore personalizzato');
verifica(CSS.includes('.vivo .casa-grande [pathLength]') && /\.vivo \.casa-grande \.casa-porta \{ animation: traccia[^}]*porta/.test(CSS), 'la casa si traccia e la porta ambra arriva per ultima');

console.log(`\n${passati} controlli passati, ${falliti} falliti.`);
process.exit(falliti ? 1 : 0);
