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
import { STORIE as TUTTE, PARTI, NOVITA_LANDING, PAGINA_NOVITA, IN_ARRIVO, PASSI, DATI, RACCONTI, ORDINE_NOVITA, TIPI_DOCUMENTI, ORIGINE, ISCRIZIONE, indirizzoArticolo, INDIRIZZO_NOVITA } from '../strumenti/storie.mjs';
// Le storie pubblicate: una con `pubblica: false` (il canone a metà, 25/10) non ha né passo né articolo.
const STORIE = TUTTE.filter((s) => s.pubblica !== false);

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
const ELENCO = esiste('novita.html') ? leggi('novita.html') : '';
const PAGINE = { '/': HTML, [INDIRIZZO_NOVITA]: ELENCO, ...Object.fromEntries(STORIE.map((s) => [indirizzoArticolo(s.id), ARTICOLI[s.id]])) };

/* ---------- 1. I file ---------- */
sezione('1. I file');
for (const f of ['assets/veste.css', 'assets/landing.css', 'assets/landing.js', 'assets/fonts/fraunces-600-latin.woff2', 'assets/fonts/fraunces-600-latin-ext.woff2', 'assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2', 'assets/img/dimorino-cartelle.webp', 'assets/img/quaderno.jpg', 'favicon.svg', 'dimora-og-2026-10.jpg', 'robots.txt', 'sitemap.xml', 'vercel.json', 'novita.html', 'assets/img/app-computer-prima.webp']) verifica(esiste(f), `c'è ${f}`);
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
// I disegni delle sezioni: la casa (Come funziona: il sorgente «casa» della regia, così com'è), l'appartamento (Se
// affitti) e la casa al mare (Seconda casa). Ognuno col suo tocco ambra, che si traccia per ultimo.
const disegnoDi = (id) => { const a = HTML.indexOf(`id="${id}"`); const b = HTML.indexOf('</section>', a); const t = HTML.slice(a, b); const i = t.indexOf('data-disegno'); return i < 0 ? '' : t.slice(i, t.indexOf('</svg>', i)); };
const casa = disegnoDi('come');
for (const d of ['M40 100V52q0-8 8-8h6', 'M72 50l34-26 34 26', 'M100 100V86a6 6 0 0 1 12 0v14z', 'M10 100h200']) verifica(casa.includes(`d="${d}"`), `la casa di Come funziona ha il tratto ${d}`);
verifica(/x="78" y="48" width="56" height="52"/.test(casa) && /x="134" y="58" width="40" height="42"/.test(casa), 'la casa di Come funziona ha i suoi due corpi');
for (const id of ['come', 'affitti', 'immobili']) {
  const d = disegnoDi(id);
  verifica(d.length > 0, `${id}: c'è il disegno della sezione`);
  verifica(/class="porta"[^>]*fill="#CE7F33"/.test(d), `${id}: il disegno ha il tocco ambra`);
  const i = [...d.matchAll(/--i:([\d.]+)/g)].map((m) => +m[1]);
  const porta = +((/class="porta"[^>]*--i:([\d.]+)/.exec(d) || [])[1] ?? -1);
  verifica(i.length > 3 && porta === Math.max(...i), `${id}: il tocco ambra si traccia per ultimo`);
}

/* ---------- 3. Le storie ---------- */
sezione('3. Le storie');
// L'ordine della pagina (secondo giro di Vitto, 25/10): apertura, come funziona, lettera, se affitti, per ogni immobile,
// gli ultimi aggiornamenti, telefono, prezzi, sicurezza, domande, chiusura. La sezione dei numeri a sé non c'è più.
const ordinePagina = ['come', 'storia', 'affitti', 'immobili', 'novita', 'prezzi', 'sicurezza', 'domande', 'inizia'].map((id) => HTML.indexOf(`id="${id}"`));
verifica(ordinePagina.every((x, i) => x > 0 && (i === 0 || x > ordinePagina[i - 1])), "l'ordine delle sezioni", ordinePagina.join(' '));
verifica(HTML.indexOf('class="telefono-sezione"') > HTML.indexOf('id="novita"') && HTML.indexOf('class="telefono-sezione"') < HTML.indexOf('id="prezzi"'), 'il riquadro del telefono fra le novità e i prezzi');
const testoPagina = testo(HTML);
verifica(!HTML.includes('id="numeri"') && !testoPagina.includes('Non sono conti da fare a mente'), "la sezione dei numeri non c'è più");
for (const via of ['Se hai una seconda casa', 'Ogni mese, qualcosa in meno', 'Ottobre 2026', 'Ci stiamo lavorando', 'Il canone, anche quando arriva a metà', 'Decide il commercialista', "L'affitto, dal contratto alla disdetta", 'più di 130', 'Più di 130']) verifica(!testoPagina.includes(via), `nella pagina non c'è più «${via}»`);
verifica(testoPagina.includes('Per ogni immobile che hai') && testoPagina.includes('Se affitti una casa'), 'i titoli delle due sezioni');
// I racconti
const racconti = {
  COME: HTML.slice(HTML.indexOf('<!--RACCONTO-COME-->'), HTML.indexOf('<!--/RACCONTO-COME-->')),
  AFFITTO: HTML.slice(HTML.indexOf('<!--RACCONTO-AFFITTO-->'), HTML.indexOf('<!--/RACCONTO-AFFITTO-->')),
  IMMOBILI: HTML.slice(HTML.indexOf('<!--RACCONTO-IMMOBILI-->'), HTML.indexOf('<!--/RACCONTO-IMMOBILI-->')),
};
const racconto = Object.values(racconti).join('\n');
const idPasso = (p) => p.storia || p.passo;
for (const [nome, r] of Object.entries(racconti)) {
  verifica(JSON.stringify(attributi(r, 'data-storia')) === JSON.stringify(RACCONTI[nome].map(idPasso)), `il racconto ${nome}: ${RACCONTI[nome].map(idPasso).join(', ')}`, attributi(r, 'data-storia').join(', '));
}
verifica(HTML.indexOf('<!--RACCONTO-COME-->') > HTML.indexOf('id="come"') && HTML.indexOf('<!--RACCONTO-AFFITTO-->') > HTML.indexOf('id="affitti"') && HTML.indexOf('<!--RACCONTO-IMMOBILI-->') > HTML.indexOf('id="immobili"'), 'ogni racconto sta nella sua sezione');
for (const p of Object.values(RACCONTI).flat()) {
  const blocco = racconto.slice(racconto.indexOf(`data-storia="${idPasso(p)}"`));
  const art = testo(blocco.slice(0, blocco.indexOf('</article>')));
  if (p.passo) {
    const x = PASSI[p.passo];
    verifica(art.includes(x.titolo) && art.includes(x.testo) && blocco.startsWith(`data-storia="${p.passo}" data-immagine="${x.immagine}"`) && esiste(x.immagine.slice(1)), `passo «${x.titolo}»: testo e schermata`);
  } else {
    const st = STORIE.find((x) => x.id === p.storia);
    verifica(!!st && art.includes(st.titolo) && art.includes(p.testo ?? st.testo) && blocco.slice(0, blocco.indexOf('</article>')).includes(`href="${indirizzoArticolo(st.id)}"`), `passo «${st?.titolo}»: testo e articolo`);
  }
}
verifica(!racconto.includes('canone-a-meta'), 'nessun racconto ha il canone a metà');
verifica(racconti.AFFITTO.includes('data-storia="pacchetto-commercialista"') && !racconti.AFFITTO.includes('/assets/novita/canone'), 'Se affitti: resta il video del commercialista, esce quello del canone');
for (const [id, d] of Object.entries(DATI)) {
  const blocco = racconti.IMMOBILI.slice(racconti.IMMOBILI.indexOf(`data-storia="${id}"`));
  const storia = blocco.slice(0, blocco.indexOf('</article>'));
  verifica(testo(storia).includes(d.testo) && storia.includes(`href="${d.indirizzo.replace(/&/g, '&amp;')}"`) && testo(storia).includes(d.fonte), `immobili: il dato «${d.testo.slice(0, 30)}…» con la sua fonte`);
}
verifica(Object.values(DATI)[0].testo.startsWith('€ 977'), "gli importi come nell'app: «€ 977»");
const scenaHtml = HTML.slice(HTML.indexOf('data-scena'), HTML.indexOf('</section>', HTML.indexOf('data-scena')));
const importiScena = [...scenaHtml.matchAll(/class="scadenza-importo">([^<]+)</g)].map((m) => m[1]);
verifica(importiScena.length === 3 && importiScena.every((x) => /^€ \d+(,\d\d)?$/.test(x)) && ['€ 312', '€ 828,67'].every((x) => importiScena.includes(x)), "le scadenze di esempio: importi come nell'app («€ 312», «€ 828,67»)");
// Il numero dei documenti: in evidenza, lo stesso in tutta la pagina e negli articoli
verifica(TIPI_DOCUMENTI === 120, 'il numero dei documenti è 120 (124 righe riconosciute su 136, la decina sotto)');
const numero = HTML.slice(HTML.indexOf('data-numero'), HTML.indexOf('</p>', HTML.indexOf('data-numero')));
verifica(HTML.indexOf('data-numero') > HTML.indexOf('id="come"') && HTML.indexOf('data-numero') < HTML.indexOf('<!--RACCONTO-COME-->'), 'il numero sta in Come funziona, accanto alla casa');
verifica(numero.includes(`data-conta="${TIPI_DOCUMENTI}">${TIPI_DOCUMENTI}<`) && testo(numero).includes(`Più di ${TIPI_DOCUMENTI} tipi di documenti della casa, riconosciuti: dal rogito alla bolletta, dal contratto d'affitto al preventivo del condominio.`), 'il numero e la sua frase, senza script già al valore');
for (const [pg, h] of Object.entries(PAGINE)) {
  const numeri = [...testo(h).matchAll(/più di (\d+|cento) tipi/gi)].map((m) => m[1]);
  verifica(numeri.every((n) => n === String(TIPI_DOCUMENTI)), `${pg}: «più di ${TIPI_DOCUMENTI} tipi» ovunque`, numeri.join(' '));
}
// Il commercialista e il CAF
for (const t of ['Tutto pronto per il commercialista o il CAF', 'le carte per il commercialista o il CAF', 'Segni la spesa da portare al commercialista o al CAF', 'Al commercialista o al CAF, un pacchetto pronto.', 'i documenti da portare al commercialista o al CAF']) verifica(testoPagina.includes(t), `CAF: «${t}»`);
// I disegni grandi: la casa in Come funziona, l'appartamento in Se affitti
verifica(/class="disegno-grande" data-disegno[\s\S]{0,80}<svg class="casa-grande"/.test(HTML.slice(HTML.indexOf('id="come"'), HTML.indexOf('id="storia"'))), 'Come funziona: la casa grande');
verifica(/class="disegno-grande" data-disegno[\s\S]{0,80}<svg class="casa-grande"/.test(HTML.slice(HTML.indexOf('id="affitti"'), HTML.indexOf('id="immobili"'))), "Se affitti: l'appartamento grande");
// L'apertura: come la landing di prima, nella veste nuova (le schermate dell'app con dati inventati).
const apertura = HTML.slice(HTML.indexOf('class="apertura"'), HTML.indexOf('id="come"'));
for (const t of ['Gestione di immobili e affitti', 'Le tue case e i tuoi affitti, sotto controllo.', 'Fotografi o carichi un documento: Dimora legge i dati e prepara le scadenze, tu controlli e confermi. Documenti, spese, contratti e incassi in un unico posto.', 'Inizia la prova gratuita', 'Dal computer hai tutti gli immobili sotto gli occhi.', 'Dal telefono fotografi il documento e lo confermi.', 'Fai una foto o carica un PDF. Dimora compila per te.']) verifica(testo(apertura).includes(t), `apertura: «${t.slice(0, 40)}»`);
verifica(!testo(apertura).includes('Da una foto.'), 'apertura: il titolo senza «Da una foto.»');
for (const f of ['app-computer.webp', 'app-telefono.webp', 'foto-bolletta.webp', 'dimorino-lettura.webp']) verifica(apertura.includes(`src="/assets/img/${f}"`) && esiste(`assets/img/${f}`), `apertura: ${f}`);
// Il telefono e gli store
const telefono = testo(HTML.slice(HTML.indexOf('class="telefono-sezione"'), HTML.indexOf('id="prezzi"')));
for (const t of ['Pensata anche per il telefono', 'App Store · in arrivo', 'Google Play · in arrivo', 'Presto anche su App Store e Google Play.']) verifica(telefono.includes(t), `telefono: «${t}»`);
verifica(testoPagina.includes('Presto anche su App Store e Google Play. Entri con la tua mail'), 'le domande dicono ancora «Presto anche su App Store e Google Play»');
// Le novità (terzo giro di Vitto, 25/10): un blocco corto, niente fila. I testi del comando, parola per parola.
const blocco = HTML.slice(HTML.indexOf('<!--NOVITA-->'), HTML.indexOf('<!--/NOVITA-->'));
verifica(NOVITA_LANDING.titolo === 'Dimora cresce con te.' && NOVITA_LANDING.testo === "Ogni settimana aggiungiamo qualcosa che ti toglie un pensiero sulle tue case. Le novità le trovi nell'app, raccontate una per una." && NOVITA_LANDING.firma === 'Il team di Dimora', 'le novità: titolo, testo e firma del comando');
verifica(blocco.length > 0 && [NOVITA_LANDING.titolo, NOVITA_LANDING.testo, NOVITA_LANDING.firma].every((t) => testo(blocco).includes(t)), 'le novità: il blocco nella pagina');
verifica(blocco.includes(`<a class="collegamento" href="${INDIRIZZO_NOVITA}">Leggi tutte le novità</a>`), 'le novità: «Leggi tutte le novità» porta a /novita');
verifica(!HTML.includes('class="aggiornamento') && !HTML.includes('<!--AGGIORNAMENTI-->') && !testoPagina.includes('Gli ultimi aggiornamenti'), "la fila degli aggiornamenti non c'è più");
const testata = HTML.slice(HTML.indexOf('<!--TESTATA-->'), HTML.indexOf('<!--/TESTATA-->'));
verifica((testata.match(/<a href="\/#novita">Novità<\/a>/g) || []).length === 2 && !testata.includes('Aggiornamenti'), 'il menu dice «Novità» e porta al blocco');
// In arrivo: due righe sole, senza pulsanti
const inArrivo = HTML.slice(HTML.indexOf('<!--IN-ARRIVO-->'), HTML.indexOf('<!--/IN-ARRIVO-->'));
const ARRIVO = ["L'adeguamento ISTAT del canone, automatico. Ogni anno Dimora calcola l'aggiornamento del tuo affitto con l'indice ufficiale e te lo ricorda.", 'Quando cambiano le regole, te lo diciamo noi. Con la legge di bilancio Dimora ti dice che cosa cambia per ognuna delle tue case.'];
verifica(IN_ARRIVO.titolo === 'In arrivo' && IN_ARRIVO.voci.length === 2 && testo(inArrivo).includes('In arrivo') && ARRIVO.every((t) => testo(inArrivo).includes(t)) && (inArrivo.match(/<li>/g) || []).length === 2, '«In arrivo» con le due righe del comando');
verifica(!/<a |<button/.test(inArrivo), '«In arrivo» senza pulsanti');
// La pagina di tutte le novità
const elenco = ELENCO.slice(ELENCO.indexOf('<main'), ELENCO.indexOf('</main>'));
verifica(/<h1[^>]*>Le novità di Dimora<\/h1>/.test(elenco) && PAGINA_NOVITA.titolo === 'Le novità di Dimora', '/novita: il titolo');
const carteElenco = [...elenco.matchAll(/<h2 class="carta-titolo"><a href="([^"]+)">/g)].map((m) => m[1]);
verifica(JSON.stringify(carteElenco) === JSON.stringify(ORDINE_NOVITA.map(indirizzoArticolo)) && ORDINE_NOVITA.length === STORIE.length && STORIE.every((x) => ORDINE_NOVITA.includes(x.id)), '/novita: tutti gli articoli pubblicati, dal più recente', carteElenco.join(' '));
verifica(ORDINE_NOVITA.every((id) => elenco.includes(`data-video-carta="/assets/novita/${id}.mp4"`)), '/novita: ogni carta col suo video piccolo');
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
  verifica(/<video[^>]*\smuted\b[^>]*\splaysinline\b[^>]*\sautoplay\b/.test(h) && !/<video[^>]*\ssrc=/.test(h), `articolo ${s.id}: il video muto, in linea e in autoplay, e non si scarica senza lo script`);
  verifica(h.includes(`<a class="indietro" href="${INDIRIZZO_NOVITA}">`) && h.includes(`>${PAGINA_NOVITA.altre}</h2>`), `articolo ${s.id}: «Tutte le novità» porta a /novita`);
}
const piede = HTML.slice(HTML.indexOf('<!--PIEDE-NOVITA-->'), HTML.indexOf('<!--/PIEDE-NOVITA-->'));
verifica(STORIE.every((s) => piede.includes(`href="${indirizzoArticolo(s.id)}"`)) && piede.includes(`href="${INDIRIZZO_NOVITA}"`) && !piede.includes('canone-a-meta'), 'il piè di pagina porta a tutti gli articoli pubblicati e a /novita');
verifica(!esiste('novita/canone-a-meta.html'), 'la pagina del canone a metà non c\'è');

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
    if (APP.has(u) || FONTI.has(u) || u === 'mailto:assistenza@dimorapp.com' || u === '/' || u === INDIRIZZO_NOVITA) return false;
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
  if (dati && p === INDIRIZZO_NOVITA) {
    verifica(dati['@type'] === 'CollectionPage' && dati.hasPart.length === STORIE.length && descr === PAGINA_NOVITA.descrizione, '/novita: CollectionPage con tutti gli articoli');
  } else if (dati && p !== '/') {
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
verifica(JSON.stringify(voci) === JSON.stringify([ORIGINE + '/', ORIGINE + INDIRIZZO_NOVITA, ...STORIE.map((s) => ORIGINE + indirizzoArticolo(s.id))]), "la mappa del sito: la landing, /novita e gli articoli, e nient'altro", voci.join(' '));
const altre = fs.readdirSync(RADICE).filter((f) => f.endsWith('.html') && f !== 'index.html' && f !== 'novita.html');
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
verifica((racconto.match(/class="storia-locandina"/g) || []).length === Object.values(RACCONTI).flat().length && numero.includes('>120<'), 'senza script ogni passo dei racconti ha la sua immagine ferma');
verifica(CSS.includes('.vivo [data-disegno][data-segue] svg > * { stroke-dasharray: 1; }') && !/stroke-dashoffset:\s*1/.test(CSS), 'senza script (o con «meno animazioni») i disegni sono già tracciati: lo spostamento lo scrive lo script');
verifica(!/<video/.test(HTML), 'nella landing nessun video senza lo script (li crea lui, senza indirizzo finché non servono)');
verifica(JS.includes('if (c === scelto && !fermi)') && JS.includes('c.video.pause()') && JS.includes('return i === attiva && inVista ? 2 : 0;'), 'gira un video solo alla volta: quello della storia sullo schermo col racconto in vista, o della carta più visibile');
verifica(["v.setAttribute('muted', '')", "v.setAttribute('playsinline', '')", "v.setAttribute('autoplay', '')", 'v.autoplay = true'].every((x) => JS.includes(x)), 'ogni video muto, in linea e in autoplay insieme');
verifica(JS.includes('p.catch(function () { pulsante(c); })') && JS.includes("b.className = 'video-avvia'") && JS.includes('if (risparmio && !c.voluto) pulsante(c)') && CSS.includes('.video-avvia {') && /\.schermo-video \{ opacity: 0;/.test(CSS), "se il telefono blocca la partenza resta l'immagine col pulsante ▶, mai un riquadro nero");
verifica(JS.includes("v.preload = 'none'"), 'i video del racconto non si scaricano prima del loro turno');
verifica(!/cursor:\s*(none|url)/.test(CSS), 'nessun cursore personalizzato');
verifica(JS.includes("document.querySelectorAll('[data-disegno]')") && JS.includes('t.el.style.strokeDashoffset = String(1 - x)') && JS.includes('t.porta) t.el.style.fillOpacity') && JS.includes("parte('disegni', function () { disegni.forEach") && !JS.includes("{ threshold: 0.5 }"), 'i disegni seguono lo scorrimento: si disegnano scendendo e si cancellano risalendo, il tocco ambra per ultimo');
// L'apertura: il portatile con la tastiera e la sequenza in tre tempi (terzo giro di Vitto, 25/10)
verifica(/class="portatile"[\s\S]*class="portatile-schermo"[\s\S]*<svg class="portatile-base"[\s\S]*class="tastiera-tasto"[\s\S]*class="tastiera-trackpad"/.test(apertura), 'apertura: il portatile ha lo schermo e, sotto, la base con la tastiera');
verifica(apertura.includes('data-sequenza') && ['class="fotocamera"', 'class="mirino"', 'class="lampo"', 'class="schermo-campi"', 'class="schermo-prima"', 'class="schermo-dopo"', 'class="riga-nuova"', 'class="foto-carta"'].every((x) => apertura.includes(x)), 'apertura: la bolletta, la fotocamera col lampo, i campi e la scadenza nuova');
verifica(['fotocamera', 'mirino', 'lampo', 'schermo-campi', 'schermo-dopo', 'riga-nuova'].every((x) => CSS.includes(`.vivo [data-sequenza] .${x} { animation: seq-`)) && CSS.includes('11s linear 2s infinite') && /\n\.fotocamera \{[^}]*opacity: 0;/.test(CSS) && !/\n\.portatile-schermo \.schermo-dopo \{[^}]*opacity/.test(CSS), "la sequenza si ripete; senza «vivo» resta l'ultimo fotogramma (i campi e la scadenza nuova)");
verifica(JS.includes("dopo('numero'") && JS.includes("document.querySelectorAll('[data-conta]')") && JS.includes('osserva.disconnect()'), 'il numero dei documenti conta quando arriva sullo schermo, una volta');

console.log(`\n${passati} controlli passati, ${falliti} falliti.`);
process.exit(falliti ? 1 : 0);
