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
const sp = (s) => String(s).replace(/\u00a0/g, ' '); // lo spazio che non va a capo (sesto giro) vale uno spazio nei confronti
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
// Il suolo (sesto giro): dal centro della casa verso i due lati, oltre il riquadro, fino ai bordi dello schermo.
for (const d of ['M40 100V52q0-8 8-8h6', 'M72 50l34-26 34 26', 'M100 100V86a6 6 0 0 1 12 0v14z', 'M110 100H-590', 'M110 100H810']) verifica(casa.includes(`d="${d}"`), `la casa di Come funziona ha il tratto ${d}`);
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
  verifica(testo(storia).includes(sp(d.testo)) && storia.includes(`href="${d.indirizzo.replace(/&/g, '&amp;')}"`) && testo(storia).includes(d.fonte), `immobili: il dato «${d.testo.slice(0, 30)}…» con la sua fonte`);
}
verifica(DATI['imu-calcolata'].testo === 'Una spesa importante, ogni anno: in media €\u00a0977 di IMU per una seconda casa nei capoluoghi. Dimora la calcola e la mette a budget, così non ti coglie di sorpresa.' && DATI['imu-calcolata'].fonte.startsWith('UIL'), "i numeri (quinto giro): l'IMU media, fonte UIL");
verifica(DATI['rate-condominio'].testo === 'Più di 45 milioni di italiani hanno a che fare con bilanci, preventivi e rate del condominio.' && DATI['rate-condominio'].fonte.startsWith('Notariato con ANACI'), 'i numeri (quinto giro): il condominio, fonte Notariato con ANACI');
const scenaHtml = HTML.slice(HTML.indexOf('data-scena'), HTML.indexOf('</section>', HTML.indexOf('data-scena')));
const importiScena = [...scenaHtml.matchAll(/class="scadenza-importo">([^<]+)</g)].map((m) => m[1]);
verifica(importiScena.length === 3 && importiScena.every((x) => /^€&nbsp;\d+(,\d\d)?$/.test(x)) && ['€&nbsp;312', '€&nbsp;828,67'].every((x) => importiScena.includes(x)), "le scadenze di esempio: importi come nell'app («€ 312», «€ 828,67»), col simbolo che non va a capo");
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
for (const t of ['Tutto pronto per il commercialista o il CAF', 'Segni la spesa da portare al commercialista o al CAF', 'Al commercialista o al CAF, un pacchetto pronto.', 'i documenti da portare al commercialista o al CAF']) verifica(testoPagina.includes(t), `CAF: «${t}»`);
// I disegni grandi: la casa in Come funziona, l'appartamento in Se affitti
verifica(/class="casa-disegno" data-disegno[\s\S]{0,80}<svg class="casa-grande"/.test(HTML.slice(HTML.indexOf('id="come"'), HTML.indexOf('id="storia"'))), 'Come funziona: la casa grande, nella scena ferma (quinto giro)');
verifica(/class="disegno-grande" data-disegno[\s\S]{0,80}<svg class="casa-grande"/.test(HTML.slice(HTML.indexOf('id="affitti"'), HTML.indexOf('id="immobili"'))), "Se affitti: l'appartamento grande");
// L'apertura: come la landing di prima, nella veste nuova (le schermate dell'app con dati inventati).
const apertura = HTML.slice(HTML.indexOf('class="apertura"'), HTML.indexOf('id="come"'));
for (const t of ['Gestione di immobili e affitti', 'Le tue case e i tuoi affitti, sotto controllo.', 'Fotografi un documento: Dimora lo mette nella casa giusta, ne ricava i dati e si ricorda le scadenze. Un fascicolo per ogni casa, che si compila da solo.', 'Inizia la prova gratuita', 'Dal computer hai tutti gli immobili sotto gli occhi.', 'Dal telefono fotografi il documento e lo confermi.', 'Fai una foto o carica un PDF. Dimora compila per te.']) verifica(testo(apertura).includes(t), `apertura: «${t.slice(0, 40)}»`);
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
// Quarto giro (26/10): tre righe, in quest'ordine.
const ARRIVO = ["I canoni e le spese, abbinati dall'estratto conto. Carichi l'estratto conto del mese: Dimora riconosce i canoni arrivati e le spese già pagate, e tu confermi con un tocco.", "L'adeguamento ISTAT del canone, automatico. Ogni anno Dimora calcola l'aggiornamento del tuo affitto con l'indice ufficiale e te lo ricorda.", "Quando cambiano le regole, te lo diciamo noi. Dimora tiene d'occhio le novità per chi possiede immobili e ti dice che cosa cambia per ognuna delle tue case."];
const posArrivo = ARRIVO.map((t) => testo(inArrivo).indexOf(t));
verifica(IN_ARRIVO.titolo === 'In arrivo' && IN_ARRIVO.voci.length === 3 && testo(inArrivo).includes('In arrivo') && posArrivo.every((x, i) => x >= 0 && (i === 0 || x > posArrivo[i - 1])) && (inArrivo.match(/<li>/g) || []).length === 3, '«In arrivo» con le tre righe del comando, nel loro ordine');
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
  const mancanti = attesi.filter((t) => !corpo.includes(sp(t)));
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
const DOMANDE = ['Per chi è pensata Dimora?', 'Non basta ChatGPT?', 'Che cosa succede alla fine della prova?', 'Quanto costa dopo la prova?', 'Come funzionano le letture AI?', 'Posso avere più letture?', 'Quali documenti legge?', 'Quanto può essere lungo un documento?', 'I miei documenti sono al sicuro?', 'Serve installare qualcosa?', 'Posso portare via i miei dati?'];
const domande = [...HTML.matchAll(/<details class="domanda"><summary><h3>([^<]+)<\/h3>/g)].map((m) => entita(m[1]));
verifica(JSON.stringify(domande) === JSON.stringify(DOMANDE), 'le undici domande nel loro ordine', domande.join(' | '));
verifica(!/<details class="domanda" open/.test(HTML), 'le domande partono chiuse');
/* Quarto giro (26/10): i testi del comando, parola per parola. */
const domandeTesto = testo(HTML.slice(HTML.indexOf('id="domande"'), HTML.indexOf('</section>', HTML.indexOf('id="domande"'))));
verifica(domandeTesto.includes("Per chi è pensata Dimora? Per chi gestisce direttamente i propri immobili, soprattutto chi ne ha più di uno: la casa in cui vive, le seconde case, quelle che affitta, quelle di famiglia. Per capire se ti è utile c'è la prova gratuita."), 'domande: «Per chi è pensata Dimora?» del quarto giro');
verifica(domandeTesto.includes("Non basta ChatGPT? Un assistente può leggere un documento. Dimora tiene il fascicolo di ogni casa negli anni, ti avvisa da sola quando qualcosa scade e fa i conti con le regole italiane, come l'IMU del tuo Comune."), 'domande: «Non basta ChatGPT?» subito dopo');
verifica(!/FAQPage/.test(HTML), 'le domande non sono nei dati strutturati (niente FAQ da aggiornare)');
verifica(testo(apertura).includes('Contratti, canoni incassati e mesi che mancano') && !testoPagina.includes('incassi e pagamenti in ritardo'), 'apertura: «Contratti, canoni incassati e mesi che mancano»');
verifica(/<p class="apertura-motto">Archivia<span class="punto">\.<\/span> Compila<span class="punto">\.<\/span> Ricorda<span class="punto">\.<\/span> Fa i conti<span class="punto">\.<\/span><\/p>/.test(apertura) && CSS.includes('.apertura-motto .punto { color: var(--c-accento); }') && apertura.indexOf('apertura-motto') < apertura.indexOf('data-posizione="apertura"'), 'apertura: il motto prima del pulsante, coi punti in ambra');
verifica(/<p class="apertura-sicuro"><a href="#sicurezza"><svg[\s\S]*?<\/svg><span>I tuoi documenti in un archivio privato e cifrato\. Non li usiamo per addestrare modelli\.<\/span><\/a><\/p>/.test(apertura) && apertura.indexOf('apertura-sicuro') > apertura.indexOf('apertura-nota'), 'apertura: il lucchetto sotto la nota porta alla sezione');
const fascicolo = HTML.slice(HTML.indexOf('class="funzioni"'), HTML.indexOf('id="risposte"'));
verifica(testo(fascicolo).includes('Un fascicolo per ogni casa, che si compila da solo. Non una cartella di file: i documenti diventano dati in ordine. Rendite, canoni, rate, scadenze e spese di ogni casa, sempre aggiornati e collegati al documento da cui vengono.') && (fascicolo.match(/class="funzione"/g) || []).length === 6 && !testoPagina.includes('Tre cose in meno'), 'il fascicolo: titolo, riga e le sei voci');
const risposte = HTML.slice(HTML.indexOf('id="risposte"'), HTML.indexOf('</section>', HTML.indexOf('id="risposte"')));
const RISPOSTE = [
  ["Quanto mi è costata la casa al mare quest'anno?", 'Apri la scheda della casa: € 3.240 fra condominio, bollette e lavori, ogni spesa con il suo documento.'],
  ["Quanta IMU pago a dicembre sull'appartamento in affitto?", '€ 412,50. È già fra le scadenze, calcolata con le aliquote del tuo Comune.'],
  ["Entro quando devo dare la disdetta all'inquilino?", 'Entro il 30 dicembre 2026. È fra le scadenze, e Dimora te lo ricorda per tempo.'],
  ["Dov'è il rogito di casa mia?", 'Nei documenti della casa, insieme a visura, mutuo e polizza. Lo apri con un tocco.'],
  ['Quanto mi rende davvero l\'appartamento che affitto?', 'Dal contratto Dimora prepara i canoni di ogni mese. Tu confermi l\'incasso e lei li mette accanto alle spese della casa: vedi quanto ti resta, anno per anno.'],
];
verifica(HTML.indexOf('id="risposte"') > HTML.indexOf('class="funzioni"') && HTML.indexOf('id="risposte"') < HTML.indexOf('id="storia"'), 'le risposte subito dopo il fascicolo');
verifica(testo(risposte).includes("Le risposte, senza cercare nei cassetti. Quello che oggi cerchi fra mail, estratti conto e cartelle, in Dimora lo trovi in un colpo d'occhio."), 'le risposte: titolo e riga');
verifica(RISPOSTE.every(([d, a]) => risposte.includes(`<dt>${d.replace(/&/g, '&amp;')}</dt><dd>${a.replace(/€ /g, '€&nbsp;')}</dd>`)) && (risposte.match(/<dt>/g) || []).length === 5, 'le risposte: le cinque righe, domanda e risposta (quinto giro)');
verifica(CSS.includes('.risposta dt { font-family: var(--font-titoli); font-weight: 600; font-style: italic;') && /@media \(min-width: 48rem\) \{ \.risposta \{ grid-template-columns/.test(CSS) && !/<video|data-video/.test(risposte), 'le risposte: domanda in corsivo, a fianco solo dal tablet, nessun video');
verifica(testoPagina.includes('Mia mamma segue da sola più di una casa, compresa quella di mia nonna: tiene tutto a mano, nel quaderno della foto, con una cura che rispetto. Io ho voluto togliere la fatica di rimettere insieme i pezzi.'), 'la storia: la frase nuova');
const sicurezza = HTML.slice(HTML.indexOf('id="sicurezza"'), HTML.indexOf('</section>', HTML.indexOf('id="sicurezza"')));
verifica(sicurezza.includes('<p class="sicurezza-evidenza">Rogiti, contratti ed estratti conto sono carte personali: le trattiamo così.</p>') && !sicurezza.includes('Ecco dove stanno'), 'sicurezza: la riga in evidenza');
const vociSicure = [...sicurezza.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
verifica(JSON.stringify(vociSicure) === JSON.stringify(['Dove stanno', 'Letti solo per te', 'Ogni documento al suo posto.', 'Li porti via quando vuoi']), 'sicurezza: la voce nuova fra «Letti solo per te» e «Li porti via quando vuoi»', vociSicure.join(' | '));
verifica(testo(sicurezza).includes('Ogni documento al suo posto. Ogni documento resta collegato alla sua casa e ai dati che ne sono stati ricavati. Se un dato manca, Dimora te lo chiede e non lo inventa.'), 'sicurezza: la frase di riserva (dalla scheda la fonte si vede solo per i dati catastali)');
verifica(!/Unione Europea|a prova di hacker|sicurezza bancaria|militare/i.test(testoPagina), 'sicurezza: nessuna frase non verificata (niente «Unione Europea», niente parole grosse)');

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
verifica(JS.includes("document.querySelectorAll('[data-disegno]')") && JS.includes('t.el.style.strokeDashoffset = String(1 - x)') && JS.includes('var CORSA = 2.4;') && JS.includes('(p * (ultimo + CORSA) - t.i) / CORSA') && JS.includes('t.porta) t.el.style.fillOpacity') && JS.includes("disegni.forEach(function (f) { leggi('disegni'") && !JS.includes("{ threshold: 0.5 }"), 'i disegni seguono lo scorrimento: si disegnano scendendo e si cancellano risalendo, il tocco ambra per ultimo');
// L'apertura: il portatile con la tastiera e la sequenza in tre tempi (terzo giro di Vitto, 25/10)
verifica(/class="portatile"[\s\S]*class="portatile-schermo"[\s\S]*<svg class="portatile-base"[\s\S]*class="tastiera-tasto"[\s\S]*class="tastiera-trackpad"/.test(apertura), 'apertura: il portatile ha lo schermo e, sotto, la base con la tastiera');
verifica(apertura.includes('data-sequenza') && ['class="fotocamera"', 'class="mirino"', 'class="lampo"', 'class="schermo-campi"', 'class="schermo-prima"', 'class="schermo-dopo"', 'class="riga-nuova"', 'class="foto-carta"'].every((x) => apertura.includes(x)), 'apertura: la bolletta, la fotocamera col lampo, i campi e la scadenza nuova');
verifica(['fotocamera', 'mirino', 'lampo', 'schermo-campi', 'schermo-dopo', 'riga-nuova'].every((x) => CSS.includes(`.vivo [data-sequenza="gira"] .${x} { animation: seq-`)) && CSS.includes('11s linear 2s infinite') && /\n\.fotocamera \{[^}]*opacity: 0;/.test(CSS) && !/\n\.portatile-schermo \.schermo-dopo \{[^}]*opacity/.test(CSS), "la sequenza si ripete; senza «vivo» resta l'ultimo fotogramma (i campi e la scadenza nuova)");
verifica(JS.includes("dopo('numero'") && JS.includes('contatore = function (p, inVista)') && JS.includes('if (contatore) contatore(p, r.top < vh)') === false && JS.includes('if (conta) conta(pc, inVista);'), 'il numero dei documenti segue la corsa della casa grande (quinto giro)');

// 9. Il quinto giro (27/10): le scene che seguono lo scorrimento
sezione('9. Il quinto giro');
const ordine = ['class="apertura"', 'data-cassetto', 'data-casa-scena', 'class="funzioni"', 'id="risposte"', 'id="storia"'].map((x) => HTML.indexOf(x));
verifica(ordine.every((x, i) => x > 0 && (i === 0 || x > ordine[i - 1])), "l'ordine: apertura, scena A, «Fotografi…» con la casa, il fascicolo, le risposte, la storia", ordine.join(' '));
const scenaA = HTML.slice(HTML.indexOf('data-cassetto'), HTML.indexOf('</section>', HTML.indexOf('data-cassetto')));
verifica(['Oggi le carte sono ovunque: nella mail, nel cassetto, nei download.', 'Con Dimora ogni documento va nella sua casa.', 'E da ogni documento escono i dati che ti servono: canoni, rendite, scadenze.'].every((t, i) => scenaA.includes(`data-fase="${i + 1}">${t}</p>`)), 'scena A: i tre testi, parola per parola');
verifica(['Bolletta luce', "Contratto d'affitto", 'Rogito', 'F24', 'Fattura idraulico', 'Foto'].every((t) => scenaA.includes(`<span class="doc-tipo">${t}</span>`)) && (scenaA.match(/data-carta /g) || []).length === 6, 'scena A: le sei carte (bolletta, contratto, rogito, F24, fattura, foto)');
verifica(['nella mail', 'nel cassetto', 'nei download'].every((t) => scenaA.includes(`<span class="doc-dove">${t}</span>`)), 'scena A: i tre posti di oggi');
verifica(['Bilocale in via Mazzini', 'Casa al mare', 'Box'].every((t) => scenaA.includes(`<span class="cartella-nome">${t}</span>`)), 'scena A: le tre cartelle');
verifica(['Contratti', 'Catasto e rogito', 'Utenze', 'Condominio'].every((t) => scenaA.includes(`<span class="fa-gruppo-nome">${t}</span>`)), 'scena A: la cartella aperta, per tipo e per anno');
verifica(scenaA.includes('data-cartellino data-a="contratto">Canone €&nbsp;650</span>') && scenaA.includes('data-cartellino data-a="visura">Rendita catastale</span>') && /cartellino-scadenza" data-cartellino data-a="visura"><i class="cartellino-punto"><\/i>Prossima scadenza 16 dic<\/span>/.test(scenaA), "scena A: i tre cartellini, la scadenza col punto ambra per ultima (sesto giro: ognuno legato alla sua riga)");
verifica(CSS.includes('.vivo .cassetto { height: 360vh; height: 360svh;') && CSS.includes('.vivo .cassetto-fermo { position: sticky; top: 64px;') && CSS.includes('.carta-doc, .cartella { opacity: 0; }'), 'scena A: ferma per tre schermi e mezzo solo con «vivo»; senza, lo stato finale');
verifica(JS.includes("vicino('[data-cassetto]', 'cassetto'") && JS.includes('var p = Math.round(limita((64 - r.top - scarto) / (corsa > 0 ? corsa : 1)) * 1000) / 1000;') && JS.includes('return { fn: function () {\n      if (cambiaD && tela)'), 'scena A: lo scorrimento manda avanti la scena, e risalendo torna indietro (solo trasformazioni)');
verifica(CSS.includes('.vivo .casa-scena { height: calc(200vh - 64px); height: calc(200svh - 64px);') && CSS.includes('.vivo .casa-fermo { position: sticky; top: 64px;') && CSS.includes('stroke-width: 2.3; }') && !/\.disegno-grande \{[^}]*border/.test(CSS), 'scena B: la casa grande senza riquadro, tratto più spesso, ferma per uno schermo con «vivo»');
verifica(JS.includes("var scena = d.closest('[data-casa-scena]');") && JS.includes('p = limita((64 + vh * 0.25 - r.top) / (corsa + vh * 0.25));'), 'scena B: si disegna con lo scorrimento e si cancella risalendo; il contatore segue la stessa corsa');
verifica(JS.includes("dopo('sequenza'") && JS.includes("seq.setAttribute('data-sequenza', '')") && JS.includes("seq.setAttribute('data-sequenza', 'gira')") && apertura.includes('data-sequenza="gira"'), "l'apertura riparte dall'inizio quando torna sullo schermo");
verifica(JS.includes("dopo('risposte'") && JS.includes("document.querySelectorAll('.risposta')") && JS.includes("riga.style.transform = 'translateY(' + ((1 - o) * 28).toFixed(1) + 'px)';"), "le risposte entrano una dopo l'altra con lo scorrimento, e tornano indietro risalendo");
verifica(JS.includes('scritture.forEach(function (w) { parte(w[0], w[1]); });'), 'un giro per fotogramma in due tempi: prima le letture, poi le scritture');
verifica(['contratto-letto', 'carta-contratto', 'canoni-mese'].every((v) => esiste(`assets/video/${v}.mp4`) && esiste(`assets/video/${v}.webp`) && fs.statSync(path.join(RADICE, `assets/video/${v}.mp4`)).size < 1024 * 1024 && HTML.includes(`data-video="/assets/video/${v}.mp4"`)), 'Se affitti: tre minivideo nuovi (sotto 1 MB), con la locandina, che partono dallo script');
verifica(PASSI['affitto-chiaro'].titolo === 'Il tuo contratto, in una carta sola.' && PASSI['affitto-chiaro'].testo === 'Quando scade, entro quando dare la disdetta, regime fiscale e deposito: tutto nella scheda della casa.', 'Se affitti: la carta del contratto, parola per parola');
verifica(PASSI.canoni.titolo === 'I canoni, mese per mese.' && PASSI.canoni.testo === "Dal contratto Dimora prepara i canoni di ogni mese. Quando arriva il bonifico confermi l'incasso con un tocco, intero o in parte, e hai tutto sotto controllo.", 'Se affitti: i canoni, parola per parola');

// 10. Il sesto giro (27/10): fluidità, la scena del fascicolo, la larghezza, gli esempi coerenti, gli importi, i video
sezione('10. Il sesto giro');
verifica(JS.includes('var RITARDO = 0.24;') && JS.includes('lisciato += (y - lisciato) * (1 - Math.exp(-dt / RITARDO));') && JS.includes('Math.abs(y - lisciato) > vh * 1.5') && JS.includes('if (scarto !== 0) chiedi();'), 'le scene seguono lo scorrimento con un ritardo morbido (circa 0,7 secondi), un salto grande non si insegue');
verifica(['cassetto(vh, scarto)', 'scena(vh, scarto)', 'f(vh, scarto)', 'apertura(lisciato)'].every((x) => JS.includes(x)) && JS.includes('return r(vh);'), 'il ritardo vale per le scene, i disegni, le risposte e l\'apertura; la finestra dei racconti segue la pagina com\'è');
verifica(JS.includes("parte('rotella'") && JS.includes("matchMedia('(hover: hover) and (pointer: fine)')") && JS.includes("{ passive: false }") && JS.includes("Math.abs(dy) < 40 || Math.abs(dy - Math.round(dy)) > 0.01") && JS.includes("['keydown', 'mousedown', 'touchstart'].forEach(function (t) { window.addEventListener(t, lascia, { passive: true }); });") && JS.includes("document.addEventListener('click', lascia, true);") && JS.includes("window.addEventListener('hashchange', lascia);"), 'la rotellina scivola solo al computer con un puntatore preciso; touchpad, telefono, tastiera e ancore restano del browser');
verifica(!/cdn\.|gsap|lenis/i.test(JS) && !/<script[^>]+src="https?:/.test(HTML.replace(/<script[^>]*_vercel[^>]*>/g, '')), 'nessuno script di terzi: il ritardo e la rotellina sono fatti a mano');
const cartaIn = (t) => (new RegExp(`data-in="([a-z]+)"><span class="doc-tipo">${t}</span>`).exec(scenaA) || [])[1];
verifica(cartaIn('Bolletta luce') === 'mare' && cartaIn('Foto') === 'mare' && cartaIn('Rogito') === 'box' && ["Contratto d'affitto", 'F24', 'Fattura idraulico'].every((t) => cartaIn(t) === 'mazzini'), 'scena A: la bolletta e la foto nella casa al mare, il rogito nel box, il resto in via Mazzini');
verifica(JS.includes('var g = 1 + 0.07 * gonfia[i];') && JS.includes("var rallenta = function (t) { return 1 - Math.pow(1 - t, 3); };") && JS.includes('7 * Math.sin(Math.PI * k)'), 'scena A: la cartella si gonfia quando la carta entra; le carte arrivano rallentando, con una rotazione che si raddrizza');
verifica(scenaA.includes('data-lega="contratto">Contratto d\'affitto · 2023</span>') && scenaA.includes('data-lega="visura">Visura catastale · 2025</span>') && (scenaA.match(/<path data-linea \/>/g) || []).length === 3 && CSS.includes('@container (min-width: 660px)'), 'scena A: i cartellini a fianco (palco largo) o sotto (palco stretto), ognuno con la linea verso la sua riga');
verifica(/\.apertura \{ padding: 20px 0 clamp\(24px, 3vw, 40px\); \}/.test(CSS), "niente spazio bianco grande fra l'apertura e la scena del fascicolo");
verifica(VESTE.includes('--larghezza: 1344px;') && VESTE.includes('--riga-max: 30em;') && CSS.includes('.in-arrivo-elenco li, .piani-note li, .articolo-passi li, .articolo-fonti li { max-width: var(--riga-max); }') && CSS.includes('main p, main dd { max-width: var(--riga-max); }'), 'la colonna a 1280 di contenuto; i paragrafi non oltre circa 68 caratteri per riga');
verifica(CSS.includes('.cassetto-palco { margin-left: 0; margin-right: calc(-1 * ((100vw - min(100vw, var(--larghezza))) / 2 + var(--margine))); }') && CSS.includes('.casa-scena { position: relative; margin-inline: calc(50% - 50vw); padding-inline: calc(50vw - 50%); background: var(--c-fondo-tenue); }'), 'la scena del fascicolo e la casa grande usano tutta la larghezza dello schermo');
const corpoIndex = HTML.slice(HTML.indexOf('<body'));
const pagine = [corpoIndex, ...Object.values(ARTICOLI).map((h) => h.slice(h.indexOf('<body')))];
verifica(pagine.every((h) => !/€ \d/.test(h) && !/\d euro\b/.test(h)), 'gli importi non vanno a capo: fra «€» e la cifra (e fra la cifra ed «euro») uno spazio che non va a capo');
verifica(DATI['imu-calcolata'].testo.includes('€\u00a0977'), "«€ 977»: il simbolo e la cifra sulla stessa riga");
const novita = ['imu-calcolata', 'rate-condominio', 'pacchetto-commercialista', 'bonus-casa', 'carichi-al-resto'];
verifica(novita.every((v) => ['mp4', 'jpg', 'webp'].every((e) => esiste(`assets/novita/${v}.${e}`)) && fs.statSync(path.join(RADICE, `assets/novita/${v}.mp4`)).size < 1024 * 1024), 'i cinque video delle novità, con le due locandine, sotto 1 MB');
verifica(esiste('strumenti/video/gira-novita.mjs') && leggi('strumenti/video/gira-novita.mjs').includes("g.strokeStyle = 'rgb(206,127,51)'"), 'i video delle novità si rigirano nella veste nuova con gira-novita.mjs');

// 11. Il settimo giro (28/10): «meno animazioni» col racconto, il portatile grigio, i contatori, via Mazzini, l'avvio pigro
sezione('11. Il settimo giro');
verifica(JS.includes("parte('quadri'") && JS.includes('var quadri = [0, 0.45, 1].map(') && JS.includes("sezione.setAttribute('data-quadri', '');") && CSS.includes('.cassetto[data-quadri] [data-quadro="2"] .cartella {') && CSS.includes('.cassetto[data-quadri] .cassetto-quadro + .cassetto-quadro {'), '«meno animazioni»: la scena del fascicolo in tre quadri fermi, ognuno col suo testo');
verifica(!/\[data-quadri\][^{]*\{[^}]*(position: sticky|animation|transition)/.test(CSS), '«meno animazioni»: nei quadri niente si ferma e niente si muove');
verifica(VESTE.includes('--c-alluminio: #C9CBCF;') && VESTE.includes('--c-alluminio-ombra: #A7AAB0;') && CSS.includes('.tastiera-piano { fill: var(--c-alluminio);') && CSS.includes('.tastiera-tasto { fill: var(--c-alluminio-tasto);') && CSS.includes('border: 7px solid var(--c-cornice-schermo);') && !/\.tastiera-[a-z]+ \{[^}]*var\(--c-(riga|fondo-tenue)\)/.test(CSS), 'il portatile è grigio alluminio, col bordo dello schermo scuro');
const contaCartella = (k) => (scenaA.match(new RegExp(`data-in="${k}"`, 'g')) || []).length;
const scrittoIn = (k) => (new RegExp(`data-cartella="${k}"[^]*?<span class="cartella-conta" data-documenti>([^<]+)</span>`).exec(scenaA) || [])[1];
verifica([['mazzini', '3 documenti'], ['mare', '2 documenti'], ['box', '1 documento']].every(([k, t]) => scrittoIn(k) === t && t.startsWith(String(contaCartella(k)) + ' ')) && JS.includes("function quanti(n) { return n === 1 ? '1 documento' : n + ' documenti'; }") && JS.includes('if (k >= 0.83) entrate[c.f]++;'), 'ogni cartella conta i suoi documenti: sale di uno a ogni carta che entra, scende risalendo');
verifica(pagine.every((h) => !/via Roma/.test(h)) && !/via Roma/.test(leggi('strumenti/storie.mjs')) && scenaA.includes('<span class="fa-titolo">Bilocale in via Mazzini</span>'), 'la scena allineata agli esempi dei video: «Bilocale in via Mazzini», nessun «via Roma» nei testi');
verifica(JS.includes('function vicino(sel, nome, fn)') && JS.includes("vicino('[data-scena]', 'scena'") && !JS.includes('(function prossima() {') && JS.includes("['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) { window.addEventListener(t, primoGesto, { passive: true }); });") && JS.includes('pieno(); subito();'), "le scene e il loro script partono solo quando servono: al primo gesto o avvicinandosi; un salto a un'ancora prepara tutto prima");

console.log(`\n${passati} controlli passati, ${falliti} falliti.`);
process.exit(falliti ? 1 : 0);
