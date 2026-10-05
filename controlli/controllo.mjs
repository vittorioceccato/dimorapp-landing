// Controllo della landing, con un comando solo e nessuna dipendenza:
//
//     node controlli/controllo.mjs
//
// Legge dal disco index.html, assets/stile.css e assets/pagina.js e verifica:
//   1. nessun segnaposto fra parentesi quadre nel testo visibile (testo, alt, placeholder, title);
//   2. i moduli della lista d'attesa sono quattro;
//   3. la data del lancio e lo stato sono scritti in un punto solo, e nessuna data è scritta a mano;
//   4. prezzi, letture, spazio e pacchetti coincidono con la tabella qui sotto;
//   5. le risorse caricate vengono solo dal sito stesso e, per il modulo, da Supabase;
//   6. i collegamenti vanno solo all'app, all'indirizzo canonico e ai mailto: del piè di pagina,
//      e quelli interni portano a sezioni che esistono.
// Esce con 1 al primo controllo fallito, dopo averli stampati tutti.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leggi = (f) => fs.readFileSync(path.join(RADICE, f), 'utf8');
const HTML = leggi('index.html');
const CSS = leggi('assets/stile.css');
const JS = leggi('assets/pagina.js');
// Lo script senza commenti (i commenti spiegano, non dichiarano). Basta per il nostro file,
// che ha «//» dentro le stringhe solo negli indirizzi «https://».
const JS_CODICE = JS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');

/* ---------- La tabella: prezzi, letture, spazio, pacchetti (nota della regia del 5/10) ---------- */
const PIANI = {
  'Dimora':      { anno: '59 €',  mese: '6,90 €',  risparmio: 29, letture: 20, gb: 5,  benvenuto: 20 },
  'Dimora Plus': { anno: '119 €', mese: '12,90 €', risparmio: 23, letture: 40, gb: 20, benvenuto: 60 },
  'Dimora Max':  { anno: '219 €', mese: '22,90 €', risparmio: 20, letture: 80, gb: 40, benvenuto: 100 },
};
const PROVA = { giorni: 30, letture: 20, gb: 1 };
const PACCHETTI = [{ letture: 20, prezzo: '6,90 €' }, { letture: 100, prezzo: '29,90 €' }];
const SUPABASE = 'https://lgmqdcozhmaimkqnhpqb.supabase.co';
const COLLEGAMENTI_AMMESSI = [
  'https://app.dimorapp.com/login',
  'https://app.dimorapp.com/termini',
  'https://app.dimorapp.com/privacy',
];
const CANONICO = 'https://dimorapp.com/';
const MAILTO_AMMESSI = ['mailto:assistenza@dimorapp.com'];

/* ---------- Un lettore di HTML minimo (la pagina è nostra e ben formata) ---------- */
const VUOTI = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
function entita(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e.toLowerCase()] ?? m;
  });
}
function attributi(s) {
  const a = {};
  for (const m of s.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) a[m[1].toLowerCase()] = entita(m[2] ?? m[3] ?? m[4] ?? '');
  return a;
}
// Restituisce i tag (con gli antenati) e i pezzi di testo (con gli antenati).
function analizza(html) {
  const pulito = html.replace(/<!--[\s\S]*?-->/g, '');
  const tag = [], testi = [], pila = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>|([^<]+)/g;
  let m, dentroRaw = null;
  while ((m = re.exec(pulito))) {
    if (m[5] !== undefined) {
      if (!dentroRaw && m[5].trim()) testi.push({ testo: entita(m[5]), antenati: pila.slice() });
      continue;
    }
    const chiude = m[1] === '/', nome = m[2].toLowerCase();
    if (dentroRaw) { if (chiude && nome === dentroRaw) { dentroRaw = null; pila.pop(); } continue; }
    if (chiude) { const i = pila.map(t => t.nome).lastIndexOf(nome); if (i >= 0) pila.length = i; continue; }
    const t = { nome, attr: attributi(m[3]), antenati: pila.slice() };
    tag.push(t);
    if (VUOTI.has(nome) || m[4] === '/') continue;
    pila.push(t);
    if (nome === 'script' || nome === 'style') dentroRaw = nome;
  }
  return { tag, testi };
}

/* ---------- I controlli ---------- */
let falliti = 0, passati = 0;
function verifica(cond, nome, dettaglio) {
  if (cond) { passati++; console.log('  ok  ' + nome); }
  else { falliti++; console.log('  NO  ' + nome + (dettaglio !== undefined ? '\n        ' + JSON.stringify(dettaglio) : '')); }
}
const spazi = (s) => s.replace(/[\s ]+/g, ' ').trim();
const { tag, testi } = analizza(HTML);
const finto = (antenati) => antenati.some(t => 'data-finto' in t.attr);
const corpo = tag.find(t => t.nome === 'body');

// Il testo visibile: i nodi di testo e gli attributi che si vedono o si leggono.
const visibile = [
  ...testi.map(t => ({ testo: t.testo, finto: finto(t.antenati), antenati: t.antenati })),
  ...tag.flatMap(t => ['alt', 'placeholder', 'title', 'aria-label'].filter(a => t.attr[a]).map(a => ({ testo: t.attr[a], finto: finto(t.antenati), antenati: t.antenati }))),
];
const tuttoIlTesto = spazi(visibile.map(v => v.testo).join(' '));
const testoVero = spazi(visibile.filter(v => !v.finto).map(v => v.testo).join(' '));

console.log('\n1. Segnaposto');
{
  const quadre = visibile.filter(v => /\[[^\]]*\]/.test(v.testo)).map(v => spazi(v.testo));
  verifica(quadre.length === 0, 'nessun segnaposto fra parentesi quadre nel testo visibile', quadre);
  verifica(visibile.length > 200, `il testo visibile è stato letto (${visibile.length} pezzi)`);
}

console.log('\n2. Moduli');
{
  const moduli = tag.filter(t => t.nome === 'form' && 'data-wl' in t.attr);
  verifica(moduli.length === 4, `i moduli della lista d'attesa sono quattro (${moduli.length})`);
  const campi = tag.filter(t => t.nome === 'input' && t.antenati.some(a => a.nome === 'form' && 'data-wl' in a.attr));
  verifica(campi.filter(c => c.attr.type === 'email').length === 4, 'ogni modulo ha il suo campo mail');
  verifica(campi.filter(c => c.attr.name === 'company').length === 4, 'ogni modulo ha il campo esca «company»');
  verifica(tag.filter(t => 'data-wl-esito' in t.attr).length === 4, 'ogni modulo ha il suo riquadro d\'esito');
  verifica(JS.includes("source: 'landing'") && JS.includes('/rest/v1/waitlist'), 'il modulo scrive nella waitlist con source \'landing\'');
  verifica((JS.match(/Grazie! Ti avvisiamo all\\'apertura\./g) || []).length === 1 && /r\.status === 201 \|\| r\.status === 409/.test(JS), '201 e 409 hanno lo stesso esito');
}

console.log('\n3. Data del lancio e stato, in un punto solo');
{
  const conLancio = tag.filter(t => 'data-lancio' in t.attr);
  const conStato = tag.filter(t => 'data-stato' in t.attr);
  verifica(conLancio.length === 1 && conLancio[0] === corpo, 'data-lancio è scritto una volta, sul <body>', conLancio.map(t => t.nome));
  verifica(conStato.length === 1 && conStato[0] === corpo, 'data-stato è scritto una volta, sul <body>', conStato.map(t => t.nome));
  const lancio = corpo.attr['data-lancio'] || '';
  verifica(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(lancio) && !isNaN(Date.parse(lancio)), `data-lancio è una data con il fuso (${lancio})`);
  verifica(['in arrivo', 'aperta'].includes(corpo.attr['data-stato']), `data-stato vale «in arrivo» o «aperta» (${corpo.attr['data-stato']})`);
  const giorno = lancio.slice(0, 10);
  const volte = [HTML, CSS, JS].reduce((n, f) => n + (f.split(giorno).length - 1), 0);
  verifica(volte === 1, `la data ${giorno} compare una volta sola fra HTML, CSS e script (${volte})`);
  const MESI = 'gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre';
  const aMano = [...tuttoIlTesto.matchAll(new RegExp(`\\b\\d{1,2} (${MESI})\\b|\\balle \\d{1,2}:\\d{2}\\b`, 'g'))].map(m => m[0]);
  verifica(aMano.length === 0, 'nessuna data scritta a mano nel testo (le frasi con la data le compone lo script)', aMano);
  const nelloScript = [...JS_CODICE.matchAll(new RegExp(`\\d{1,2} (${MESI})|\\d{1,2}:\\d{2}|20\\d\\d-\\d\\d-\\d\\d`, 'g'))].map(m => m[0]);
  verifica(nelloScript.length === 0, 'nessuna data scritta nello script', nelloScript);
  verifica(tag.filter(t => 'data-quando' in t.attr).length === 2, 'le frasi con la data sono due, e si compongono da data-lancio');
}

console.log('\n4. Prezzi, letture, spazio e pacchetti');
{
  const schede = tag.filter(t => t.nome === 'article' && 'data-piano' in t.attr);
  verifica(JSON.stringify(schede.map(s => s.attr['data-piano'])) === JSON.stringify(Object.keys(PIANI)), 'i piani sono tre, nell\'ordine della tabella', schede.map(s => s.attr['data-piano']));
  for (const s of schede) {
    const atteso = PIANI[s.attr['data-piano']];
    if (!atteso) continue;
    const t = spazi(testi.filter(x => x.antenati.includes(s)).map(x => x.testo).join(' '));
    verifica(t.includes(`${atteso.anno} l'anno`), `${s.attr['data-piano']}: ${atteso.anno} l'anno`, t);
    verifica(t.includes(`oppure ${atteso.mese} al mese. Con l'annuale risparmi circa il ${atteso.risparmio}%.`), `${s.attr['data-piano']}: ${atteso.mese} al mese, risparmio circa il ${atteso.risparmio}%`, t);
    verifica(t.includes(`${atteso.letture} letture AI al mese`) && t.includes(`${atteso.gb} GB di archivio`), `${s.attr['data-piano']}: ${atteso.letture} letture AI al mese, ${atteso.gb} GB`, t);
    const anno = parseFloat(atteso.anno), mese = parseFloat(atteso.mese.replace(',', '.'));
    verifica(Math.round((1 - anno / (12 * mese)) * 100) === atteso.risparmio, `${s.attr['data-piano']}: il risparmio dichiarato torna con i prezzi`);
  }
  verifica(testoVero.includes(`${PROVA.giorni} giorni, ${PROVA.letture} letture con l'AI e ${PROVA.gb} GB di archivio, senza carta.`), `la prova: ${PROVA.giorni} giorni, ${PROVA.letture} letture, ${PROVA.gb} GB`);
  const benvenuto = Object.entries(PIANI).map(([n, p]) => `${p.benvenuto} con ${n}`).join(', ').replace(/, ([^,]*)$/, ', $1');
  verifica(testoVero.includes(`da usare entro 12 mesi: ${Object.entries(PIANI).map(([n, p]) => `${p.benvenuto} con ${n}`).join(', ')}.`), `le letture di benvenuto: ${benvenuto}`);
  verifica(testoVero.includes(`Ti servono più letture? ${PACCHETTI.map(p => `${p.letture} a ${p.prezzo}`).join(', ')}, valide 12 mesi.`), 'i pacchetti di letture');
  // Nessun altro prezzo, numero di letture o spazio nel testo vero (le anteprime decorative sono escluse).
  const euroAmmessi = new Set([...Object.values(PIANI).flatMap(p => [p.anno, p.mese]), ...PACCHETTI.map(p => p.prezzo)].map(spazi));
  const euro = [...testoVero.matchAll(/(\d+(?:,\d+)?) €/g)].map(m => m[0]).filter(e => !euroAmmessi.has(e));
  verifica(euro.length === 0, 'nessun altro importo in euro', euro);
  const gbAmmessi = new Set([PROVA.gb, ...Object.values(PIANI).map(p => p.gb)]);
  const gb = [...testoVero.matchAll(/(\d+) GB/g)].map(m => +m[1]).filter(n => !gbAmmessi.has(n));
  verifica(gb.length === 0, 'nessun altro spazio in GB', gb);
  const lettureAmmesse = new Set([PROVA.letture, ...Object.values(PIANI).map(p => p.letture)]);
  const letture = [...testoVero.matchAll(/(\d+) letture/g)].map(m => +m[1]).filter(n => !lettureAmmesse.has(n));
  verifica(letture.length === 0, 'nessun altro numero di letture', letture);
}

console.log('\n5. Risorse caricate');
{
  const caricate = [];
  for (const t of tag) {
    if (t.nome === 'script' && t.attr.src) caricate.push(t.attr.src);
    if (t.nome === 'link' && t.attr.rel !== 'canonical') caricate.push(t.attr.href);
    if (['img', 'source', 'iframe', 'video', 'audio', 'embed'].includes(t.nome) && t.attr.src) caricate.push(t.attr.src);
    if (t.attr.srcset) caricate.push(...t.attr.srcset.split(',').map(s => s.trim().split(/\s+/)[0]));
    if (t.attr.style) caricate.push(...[...t.attr.style.matchAll(/url\(\s*['"]?([^'")]+)/g)].map(m => m[1]));
  }
  caricate.push(...[...CSS.matchAll(/url\(\s*['"]?([^'")]+)/g)].map(m => 'assets/' + m[1]));
  caricate.push(...[...CSS.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/g)].map(m => m[1]));
  const esterne = caricate.filter(u => /^(https?:)?\/\//i.test(u));
  verifica(esterne.length === 0, `script, stili, font e immagini vengono dal sito (${caricate.length} risorse)`, esterne);
  const mancanti = caricate.filter(u => !/^(https?:)?\/\//i.test(u)).map(u => u.split(/[?#]/)[0]).filter(u => !fs.existsSync(path.join(RADICE, u)));
  verifica(mancanti.length === 0, 'ogni risorsa esiste nel repository', mancanti);
  const indirizziScript = [...JS_CODICE.matchAll(/https?:\/\/[^\s'"`)]+/g)].map(m => m[0]);
  verifica(indirizziScript.length > 0 && indirizziScript.every(u => new URL(u).origin === SUPABASE), 'lo script chiama solo Supabase (per il modulo)', indirizziScript);
  verifica(!/fonts\.googleapis|fonts\.gstatic|googletagmanager|google-analytics|plausible|<iframe/i.test(HTML + CSS + JS), 'niente carattere da altri siti, niente statistiche');
  verifica(!/document\.cookie|localStorage|sessionStorage/.test(JS), 'nessun cookie, nessuna memoria nel browser');
}

console.log('\n6. Collegamenti');
{
  const ids = new Set(tag.filter(t => t.attr.id).map(t => t.attr.id));
  const link = tag.filter(t => t.nome === 'a' && t.attr.href !== undefined);
  const interni = link.filter(a => a.attr.href.startsWith('#'));
  const rotti = interni.filter(a => !ids.has(a.attr.href.slice(1))).map(a => a.attr.href);
  verifica(interni.length > 0 && rotti.length === 0, `i ${interni.length} collegamenti interni portano a sezioni che esistono`, rotti);
  const mailto = link.filter(a => a.attr.href.startsWith('mailto:'));
  verifica(mailto.length > 0 && mailto.every(a => MAILTO_AMMESSI.includes(a.attr.href) && a.antenati.some(x => x.nome === 'footer')), 'i mailto: sono solo quelli del piè di pagina', mailto.map(a => a.attr.href));
  const altri = link.filter(a => !a.attr.href.startsWith('#') && !a.attr.href.startsWith('mailto:')).map(a => a.attr.href).filter(h => !COLLEGAMENTI_AMMESSI.includes(h) && h !== CANONICO);
  verifica(altri.length === 0, 'gli altri collegamenti vanno solo all\'app (login, termini, privacy) o all\'indirizzo canonico', altri);
  const canonici = tag.filter(t => t.nome === 'link' && t.attr.rel === 'canonical');
  verifica(canonici.length === 1 && canonici[0].attr.href === CANONICO, `l'indirizzo canonico è ${CANONICO}`);
  const accedi = link.filter(a => spazi(testi.filter(x => x.antenati.includes(a)).map(x => x.testo).join(' ')) === 'Accedi').map(a => a.attr.href);
  verifica(accedi.length >= 2 && accedi.every(h => h === 'https://app.dimorapp.com/login'), '«Accedi» porta a app.dimorapp.com/login', accedi);
}

console.log(`\n${passati} passati, ${falliti} falliti`);
process.exit(falliti ? 1 : 0);
