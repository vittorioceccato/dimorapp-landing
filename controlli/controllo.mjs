// Controllo della landing, con un comando solo e nessuna dipendenza:
//
//     node controlli/controllo.mjs
//
// Legge dal disco index.html, assets/stile.css e assets/pagina.js e verifica:
//   1. nessun segnaposto fra parentesi quadre nel testo visibile (testo, alt, placeholder, title);
//   2. i moduli della lista d'attesa sono quattro;
//   3. la data del lancio e lo stato sono scritti in un punto solo, e nessuna data è scritta a mano;
//   4. prezzi, immobili, letture, spazio, regalo dell'annuale e pacchetti coincidono con la tabella
//      qui sotto, e il risparmio in euro è ricavato dai prezzi delle schede;
//   5. le risorse caricate vengono solo dal sito stesso e, per il modulo, da Supabase;
//   6. i collegamenti vanno solo all'app, all'indirizzo canonico e ai mailto: del piè di pagina,
//      e quelli interni portano a sezioni che esistono;
//   7. i testi approvati (schede, prova, note sotto le schede, Dimorino), parola per parola,
//      e i testi tolti non ci sono più da nessuna parte;
//   8. l'interruttore annuale / mensile: bottoni veri, l'annuale scelto, il «fino al» ricavato dai prezzi,
//      senza script i due prezzi insieme e il regalo, con il mensile risparmio e regalo invisibili;
//   9. le domande frequenti: una per riga, chiuse, nel loro ordine, e le risposte nuove parola per parola.
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

/* ---------- La tabella: prezzi, immobili, letture, spazio, regalo, pacchetti (regia, 6/10) ----------
   Il risparmio dell'annuale non sta qui: si ricava dai prezzi scritti nelle schede. */
const PIANI = {
  'Dimora':      { anno: '59 €',  mese: '6,90 €',  immobili: 3,  letture: 10, gb: 5,  regalo: 10 },
  'Dimora Plus': { anno: '119 €', mese: '12,90 €', immobili: 10, letture: 20, gb: 10, regalo: 20 },
  'Dimora Max':  { anno: '219 €', mese: '22,90 €', immobili: 25, letture: 40, gb: 20, regalo: 40 },
};
const PROVA = { giorni: 30, letture: 20, gb: 1 };
const PACCHETTI = [{ letture: 10, prezzo: '4,90 €' }, { letture: 20, prezzo: '7,90 €' }, { letture: 100, prezzo: '34,90 €' }];
const SUPABASE = 'https://lgmqdcozhmaimkqnhpqb.supabase.co';
const COLLEGAMENTI_AMMESSI = [
  'https://app.dimorapp.com/login',
  'https://app.dimorapp.com/termini',
  'https://app.dimorapp.com/privacy',
];
const CANONICO = 'https://dimorapp.com/';
const MAILTO_AMMESSI = ['mailto:assistenza@dimorapp.com'];

/* ---------- I testi approvati da Vitto parola per parola (regia, 5/10 e 6/10) ---------- */
const TESTI = {
  // Le schede, piano per piano: dotazione, riga del risparmio, descrizione, regalo dell'annuale.
  schede: {
    'Dimora': {
      dotazione: ['Fino a 3 immobili', '10 letture AI al mese', '5 GB di archivio'],
      risparmio: "Con l'annuale risparmi 23,80 €.",
      desc: 'Per la tua casa e una o due seconde case, anche in affitto.',
      regalo: 'In regalo con il primo annuale: 10 letture AI in più, da usare quando vuoi entro 12 mesi.',
    },
    'Dimora Plus': {
      dotazione: ['Fino a 10 immobili', '20 letture AI al mese', '10 GB di archivio'],
      risparmio: "Con l'annuale risparmi 35,80 €.",
      desc: 'Per chi affitta più immobili e ha contratti, inquilini e scadenze da seguire.',
      regalo: 'In regalo con il primo annuale: 20 letture AI in più, da usare quando vuoi entro 12 mesi.',
    },
    'Dimora Max': {
      dotazione: ['Fino a 25 immobili', '40 letture AI al mese', '20 GB di archivio'],
      risparmio: "Con l'annuale risparmi 55,80 €.",
      desc: 'Per chi gestisce molti immobili, propri o di famiglia.',
      regalo: 'In regalo con il primo annuale: 40 letture AI in più, da usare quando vuoi entro 12 mesi.',
    },
  },
  periodoAnno: "l'anno, in un'unica soluzione",
  periodoMese: 'al mese',
  prova: "30 giorni, 20 letture con l'AI e 1 GB di archivio, senza carta e senza addebiti automatici. Tutte le funzioni, senza limite di immobili.",
  piani: 'Tutte le funzioni sono in ogni piano. Cambiano gli immobili, le letture AI e lo spazio.',
  // Le note sotto le schede: tre, in quest'ordine, e nient'altro.
  note: [
    'Una lettura AI copre fino a 10 pagine di un documento.',
    'Ti servono più letture? Ci sono i pacchetti aggiuntivi.',
    'Piani e prezzi sono previsti e possono ancora cambiare: te li confermiamo prima di attivare i pagamenti.',
  ],
  fineProva: "Nessun addebito: la carta non te la chiediamo. Se non scegli un piano, il tuo account resta in sola consultazione: vedi, scarichi ed esporti tutto quello che hai caricato. Quando scegli un piano riprendi da dove eri. Se hai più immobili di quelli del piano, scegli tu quali tenere in gestione: gli altri restano consultabili.",
  costo: "Da 59 € l'anno o 6,90 € al mese. Tutte le funzioni sono in ogni piano: cambiano gli immobili, le letture AI e lo spazio. I tre piani sono nella sezione Prezzi, e senza una tua scelta non c'è nessun addebito. Se gestisci più di 25 immobili, scrivici.",
  lettureDomanda: 'Come funzionano le letture AI?',
  lettureRisposta: 'Una lettura copre fino a 10 pagine di un documento: per un contratto di 14 pagine ne servono 2. Archiviare un documento o inserire i dati a mano non consuma letture.',
  pacchettiDomanda: 'Posso avere più letture?',
  pacchettiRisposta: 'Sì, con i pacchetti aggiuntivi: 10 letture a 4,90 €, 20 a 7,90 €, 100 a 34,90 €. Valgono 12 mesi e si comprano con un piano attivo.',
  eroe: 'Per chi ha una casa o più di una, e per chi affitta. Dimora legge bollette, contratti e rate del condominio, prepara le scadenze e ti avvisa per tempo. Tu controlli e confermi.',
  firma: 'ha ideato Dimora',
  guidaOcchiello: 'LA TUA GUIDA',
  guidaTitolo: 'Ti presento Dimorino',
  guidaTesto: "È la tua guida dentro Dimora: ti segue passo passo e ti aiuta con documenti, scadenze e tutto quello che riguarda la casa. Lo incontri quando entri per la prima volta e mentre Dimora legge i tuoi documenti. Ti tiene compagnia nell'attesa: a confermare i dati, come sempre, sei tu.",
  sicuroDomanda: 'I miei documenti sono al sicuro?',
  sicuroRisposta: "Restano nel tuo archivio, protetto dal tuo accesso. L'AI li legge solo per compilare i campi, e non vengono usati per addestrare modelli. I dettagli sono nell'informativa sulla privacy.",
  annuale: 'Annuale (risparmi fino al {N}%)',
  mensile: 'Mensile',
};
// I testi di prima, che non devono esserci più da nessuna parte (né nella pagina, né nello stile, né nello script).
const VIA = [
  'LA MASCOTTE', 'Dove vanno i miei documenti?', 'se ne ha, una o due seconde case',
  // Le sei note sotto le schede tolte il 6/10.
  'Sono indicazioni, non limiti: in ogni piano puoi gestire tutti gli immobili che vuoi.',
  'tutti gli immobili che vuoi',
  'Durante la beta ogni documento letto consuma una lettura.',
  'Archiviare e inserire a mano non consuma letture.',
  'Con il piano annuale ricevi anche letture di benvenuto',
  'Ti servono più letture? 20 a',
  'Finita la prova, se non scegli un piano il tuo account resta in sola consultazione: vedi, scarichi ed esporti tutto.',
  // Due frasi di versioni precedenti del listino che non vanno messe da nessuna parte (regia, 6/10).
  'I file Word, Excel e CSV contano sempre una lettura.',
  'si rinnovano ogni mese',
  'non si accumulano',
  // Le formule di prima delle schede.
  'risparmi circa il', 'Indicativamente', 'Consigliato per chi',
  // Il testo in alto e la firma di prima (6/10).
  'e per chi affitta da sé', 'legge ogni segnalazione',
];
// Le domande frequenti, nel loro ordine: dopo «Quanto costa dopo la prova?» le due sulle letture.
const DOMANDE = [
  'Per chi è pensata Dimora?',
  'Che cosa succede alla fine della prova?',
  'Quanto costa dopo la prova?',
  TESTI.lettureDomanda,
  TESTI.pacchettiDomanda,
  'Quali documenti legge?',
  'Quanto può essere lungo un documento?',
  TESTI.sicuroDomanda,
  'Serve installare qualcosa?',
  'Posso portare via i miei dati?',
];
// Le risposte che non cambiano (oltre a quella sui documenti al sicuro).
const RISPOSTE_DI_SEMPRE = {
  'Per chi è pensata Dimora?': "Per chi ha una casa o più di una da seguire, e per chi affitta: un solo appartamento o più immobili, con contratti e inquilini diversi. Per capire se ti è utile c'è la prova gratuita.",
  'Quali documenti legge?': "Più di 60 tipi di documenti della casa: bollette, contratti d'affitto, preventivi e bilanci del condominio, F24, polizze, rogiti, conferme di prenotazione e molti altri, in foto, PDF, Word, Excel o CSV. Se un documento non lo riconosce, lo archivi lo stesso e compili a mano.",
  'Quanto può essere lungo un documento?': 'Nella beta Dimora legge fino a 30 pagine scansionate o fotografate per documento; un PDF con il testo anche di più. Se il documento è più lungo, prima della lettura ti avvisa che alcune pagine potrebbero restare fuori, e alla fine ti dice quante ne ha inviate in lettura.',
  'Serve installare qualcosa?': "No. Dimora funziona dal browser, sul computer e sul telefono, e sul telefono puoi aggiungerla alla schermata Home. L'app per App Store e Google Play è in arrivo. Entri con la tua mail, senza password.",
  'Posso portare via i miei dati?': "Sì. Dalle Impostazioni scarichi i tuoi dati in un file, quando vuoi. Ogni documento lo scarichi dalla sua pagina, e quelli del fascicolo per il commercialista anche tutti insieme, in uno ZIP. Se decidi di andartene, elimini l'account.",
};

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
const classi = (t) => (t.attr.class || '').split(/\s+/).filter(Boolean);
const conClasse = (c, dentro) => tag.filter(t => classi(t).includes(c) && (!dentro || t.antenati.includes(dentro)));
const testoDi = (t) => spazi(testi.filter(x => x.antenati.includes(t)).map(x => x.testo).join(' '));
// Un importo scritto «6,90 €» in centesimi.
const centesimi = (s) => { const m = /^(\d+)(?:,(\d{2}))? €$/.exec(spazi(s)); return m ? +m[1] * 100 + +(m[2] || 0) : NaN; };
// E al contrario: dei centesimi scritti «23,80 €».
const inEuro = (c) => `${Math.floor(c / 100)},${String(c % 100).padStart(2, '0')} €`;

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

console.log('\n4. Prezzi, immobili, letture, spazio, regalo e pacchetti');
{
  const schede = tag.filter(t => t.nome === 'article' && 'data-piano' in t.attr);
  verifica(JSON.stringify(schede.map(s => s.attr['data-piano'])) === JSON.stringify(Object.keys(PIANI)), 'i piani sono tre, nell\'ordine della tabella', schede.map(s => s.attr['data-piano']));
  for (const s of schede) {
    const nome = s.attr['data-piano'];
    const atteso = PIANI[nome], approvato = TESTI.schede[nome];
    if (!atteso || !approvato) continue;
    const t = testoDi(s);
    const pezzo = (c) => conClasse(c, s).map(testoDi);
    const uno = (c, x) => JSON.stringify(pezzo(c)) === JSON.stringify([x]);
    const figli = tag.filter(x => x.antenati[x.antenati.length - 1] === s);
    verifica(uno('piano-prezzo-anno', `${atteso.anno} ${TESTI.periodoAnno}`), `${nome}: con l'annuale «${atteso.anno} ${TESTI.periodoAnno}»`, pezzo('piano-prezzo-anno'));
    verifica(uno('piano-prezzo-mese', `${atteso.mese} ${TESTI.periodoMese}`), `${nome}: con il mensile «${atteso.mese} ${TESTI.periodoMese}»`, pezzo('piano-prezzo-mese'));
    // Il risparmio in euro si ricava dai prezzi scritti nella scheda: 12 volte il mensile meno l'annuale.
    const cifra = (c) => centesimi(conClasse(c, s).flatMap(b => tag.filter(x => x.antenati.includes(b) && classi(x).includes('piano-cifra')).map(testoDi))[0] || '');
    const cAnno = cifra('piano-prezzo-anno'), cMese = cifra('piano-prezzo-mese');
    const risparmio = 12 * cMese - cAnno;
    verifica(cAnno === centesimi(atteso.anno) && cMese === centesimi(atteso.mese) && risparmio > 0, `${nome}: i prezzi letti dalla scheda tornano con la tabella (12 × ${atteso.mese} − ${atteso.anno} = ${inEuro(risparmio)})`);
    verifica(uno('piano-risparmio', `Con l'annuale risparmi ${inEuro(risparmio)}.`), `${nome}: «Con l'annuale risparmi ${inEuro(risparmio)}.», ricavato dai prezzi`, pezzo('piano-risparmio'));
    verifica(uno('piano-risparmio', approvato.risparmio), `${nome}: la riga del risparmio è quella approvata`, pezzo('piano-risparmio'));
    verifica(uno('piano-oppure', `oppure ${atteso.mese} al mese.`), `${nome}: senza script «oppure ${atteso.mese} al mese.» accanto al prezzo dell'anno`, pezzo('piano-oppure'));
    // La dotazione: tre voci, in quest'ordine, la prima nuova.
    const dot = conClasse('piano-dotazione', s);
    const voci = dot.length === 1 ? tag.filter(x => x.antenati[x.antenati.length - 1] === dot[0]).map(testoDi) : [];
    verifica(JSON.stringify(voci) === JSON.stringify(approvato.dotazione), `${nome}: ${approvato.dotazione.join(' · ')}`, voci);
    verifica(JSON.stringify(voci) === JSON.stringify([`Fino a ${atteso.immobili} immobili`, `${atteso.letture} letture AI al mese`, `${atteso.gb} GB di archivio`]), `${nome}: la dotazione torna con la tabella (${atteso.immobili} immobili, ${atteso.letture} letture, ${atteso.gb} GB)`);
    verifica(uno('piano-desc', approvato.desc), `${nome}: la descrizione`, pezzo('piano-desc'));
    verifica(uno('piano-regalo', approvato.regalo) && approvato.regalo.includes(`: ${atteso.regalo} letture AI in più,`), `${nome}: il regalo del primo annuale (${atteso.regalo} letture)`, pezzo('piano-regalo'));
    verifica(figli.length >= 2 && classi(figli[figli.length - 1]).includes('piano-regalo') && classi(figli[figli.length - 2]).includes('piano-desc'), `${nome}: il regalo è l'ultima riga della scheda, sotto la descrizione`, figli.map(f => classi(f).join('.')));
    const suRichiesta = nome === 'Dimora Max';
    verifica(t.includes('Attivazione su richiesta') === suRichiesta, `${nome}: «Attivazione su richiesta» ${suRichiesta ? "c'è" : "non c'è"}`);
  }
  verifica(testoVero.includes(`${PROVA.giorni} giorni, ${PROVA.letture} letture con l'AI e ${PROVA.gb} GB di archivio, senza carta`), `la prova: ${PROVA.giorni} giorni, ${PROVA.letture} letture, ${PROVA.gb} GB`);
  const pacchetti = PACCHETTI.map((p, i) => `${p.letture}${i ? '' : ' letture'} a ${p.prezzo}`).join(', ');
  verifica(testoVero.includes(`con i pacchetti aggiuntivi: ${pacchetti}. Valgono 12 mesi`), `i pacchetti di letture: ${pacchetti}`);
  // Nessun altro prezzo, numero di immobili, di letture o spazio nel testo vero (le anteprime decorative sono escluse).
  const risparmi = Object.values(PIANI).map(p => inEuro(12 * centesimi(p.mese) - centesimi(p.anno)));
  const euroAmmessi = new Set([...Object.values(PIANI).flatMap(p => [p.anno, p.mese]), ...PACCHETTI.map(p => p.prezzo), ...risparmi].map(spazi));
  const euro = [...testoVero.matchAll(/(\d+(?:,\d+)?) €/g)].map(m => m[0]).filter(e => !euroAmmessi.has(e));
  verifica(euro.length === 0, `nessun altro importo in euro (i risparmi ammessi sono quelli dei prezzi: ${risparmi.join(', ')})`, euro);
  const immobiliAmmessi = new Set(Object.values(PIANI).map(p => p.immobili));
  const immobili = [...testoVero.matchAll(/(\d+) immobili/g)].map(m => +m[1]).filter(n => !immobiliAmmessi.has(n));
  verifica(immobili.length === 0, 'nessun altro numero di immobili', immobili);
  const gbAmmessi = new Set([PROVA.gb, ...Object.values(PIANI).map(p => p.gb)]);
  const gb = [...testoVero.matchAll(/(\d+) GB/g)].map(m => +m[1]).filter(n => !gbAmmessi.has(n));
  verifica(gb.length === 0, 'nessun altro spazio in GB', gb);
  const lettureAmmesse = new Set([PROVA.letture, ...Object.values(PIANI).flatMap(p => [p.letture, p.regalo]), ...PACCHETTI.map(p => p.letture)]);
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

console.log('\n7. Testi approvati, parola per parola');
{
  const prova = conClasse('prova-desc').map(testoDi);
  verifica(JSON.stringify(prova) === JSON.stringify([TESTI.prova]), 'la prova gratuita', prova);
  const testa = conClasse('piani-testa');
  const sotto = testa.length === 1 ? tag.filter(t => t.nome === 'span' && t.antenati[t.antenati.length - 1] === testa[0]).map(testoDi) : [];
  verifica(JSON.stringify(sotto) === JSON.stringify([TESTI.piani]), 'la frase dei piani', sotto);
  const elencoNote = conClasse('piani-note');
  const note = elencoNote.length === 1 ? tag.filter(t => t.nome === 'li' && t.antenati[t.antenati.length - 1] === elencoNote[0]) : [];
  verifica(JSON.stringify(note.map(testoDi)) === JSON.stringify(TESTI.note), `le note sotto le schede sono ${TESTI.note.length}, in quest'ordine, e nient'altro`, note.map(testoDi));
  verifica(note.length > 0 && classi(note[note.length - 1]).includes('piani-note-ultima'), 'la nota sui prezzi previsti chiude il riquadro');
  const eroe = conClasse('eroe-lead').map(testoDi);
  verifica(JSON.stringify(eroe) === JSON.stringify([TESTI.eroe]), 'il testo in alto (uno solo, per computer e telefono)', eroe);
  const firma = conClasse('firma-ruolo').map(testoDi);
  verifica(JSON.stringify(firma) === JSON.stringify([TESTI.firma]), `la firma della lettera: «${TESTI.firma}»`, firma);
  const allApertura = "30 giorni gratis, 20 letture con l'AI, senza carta.";
  verifica(tuttoIlTesto.split(allApertura).length - 1 === 3, `«${allApertura}» in cima e in fondo, come prima (3 volte)`);
  const guida = conClasse('mascotte-testi');
  verifica(guida.length === 1, 'Dimorino ha un riquadro solo');
  const g = guida[0];
  const dentro = (prova) => tag.filter(t => t.antenati.includes(g) && prova(t)).map(testoDi);
  const occhiello = dentro(t => classi(t).includes('occhiello')), titolo = dentro(t => t.nome === 'h3'), testo = dentro(t => t.nome === 'p');
  verifica(JSON.stringify(occhiello) === JSON.stringify([TESTI.guidaOcchiello]), `Dimorino: «${TESTI.guidaOcchiello}»`, occhiello);
  verifica(JSON.stringify(titolo) === JSON.stringify([TESTI.guidaTitolo]), `Dimorino: «${TESTI.guidaTitolo}»`, titolo);
  verifica(JSON.stringify(testo) === JSON.stringify([TESTI.guidaTesto]), 'Dimorino: il testo', testo);
  // Né nel testo della pagina, né nel sorgente (anche nei commenti), né nello stile, né nello script.
  const sorgenti = [tuttoIlTesto, spazi(entita(HTML)), spazi(CSS), spazi(JS)];
  const rimasti = VIA.filter(v => sorgenti.some(s => s.includes(v)));
  verifica(rimasti.length === 0, `i testi di prima non ci sono più da nessuna parte (${VIA.length} cercati)`, rimasti);
}

console.log("\n8. L'interruttore annuale / mensile");
{
  const sezione = tag.find(t => t.nome === 'section' && t.attr.id === 'prezzi');
  verifica(!!sezione && 'data-prezzi' in sezione.attr && !('data-periodo' in sezione.attr), 'la sezione dei prezzi ha data-prezzi e nasce senza data-periodo (lo scrive lo script)');
  const inter = conClasse('interruttore');
  verifica(inter.length === 1 && inter[0].antenati.includes(sezione), "l'interruttore è uno, nella sezione dei prezzi");
  const i0 = inter[0];
  const testa = conClasse('piani-testa')[0], griglia = conClasse('piani')[0];
  verifica(!!testa && !!griglia && tag.indexOf(testa) < tag.indexOf(i0) && tag.indexOf(i0) < tag.indexOf(griglia), "l'interruttore sta sotto «Tutte le funzioni…» e sopra le tre schede");
  verifica(!!testa && testoDi(testa).endsWith(TESTI.piani), "la frase sopra l'interruttore è quella approvata", testa && testoDi(testa));
  const dentro = tag.filter(t => t.antenati.includes(i0));
  const bottoni = dentro.filter(t => t.nome === 'button');
  verifica(bottoni.length === 2 && bottoni.every(b => b.attr.type === 'button') && !dentro.some(t => ['a', 'input', 'label', 'select'].includes(t.nome)), "due bottoni veri (type=\"button\") e nient'altro di cliccabile");
  const [anno, mese] = bottoni;
  verifica(anno?.attr['data-periodo-scelta'] === 'anno' && anno?.attr['aria-pressed'] === 'true', "il primo è l'annuale, scelto all'apertura (aria-pressed=\"true\")");
  verifica(mese?.attr['data-periodo-scelta'] === 'mese' && mese?.attr['aria-pressed'] === 'false', 'il secondo è il mensile (aria-pressed="false")');
  const tAnno = anno ? testoDi(anno) : '', tMese = mese ? testoDi(mese) : '';
  const scritto = Number((/fino al (\d+)%/.exec(tAnno) || [])[1]);
  // Il risparmio più alto, ricavato dai prezzi scritti nelle schede (non dalla tabella e non dal testo), per difetto.
  const schede = tag.filter(t => t.nome === 'article' && 'data-piano' in t.attr);
  const cifra = (s, c) => centesimi(conClasse(c, s).flatMap(b => tag.filter(x => x.antenati.includes(b) && classi(x).includes('piano-cifra')).map(testoDi))[0] || '');
  const risparmi = schede.map(s => (1 - cifra(s, 'piano-prezzo-anno') / (12 * cifra(s, 'piano-prezzo-mese'))) * 100);
  const massimo = Math.floor(Math.max(...risparmi));
  verifica(risparmi.length === 3 && risparmi.every(r => isFinite(r) && r > 0), `i risparmi letti dalle schede: ${risparmi.map(r => r.toFixed(2)).join('%, ')}%`);
  verifica(scritto === massimo, `«fino al ${scritto}%» è il risparmio più alto delle schede, per difetto (${massimo}%)`);
  verifica(tAnno === TESTI.annuale.replace('{N}', String(massimo)) && tMese === TESTI.mensile, `le due voci: «${tAnno}» e «${tMese}»`);
  const css = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const regola = (sel) => [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(m => m[1].split(',').map(x => x.trim()).includes(sel)).map(m => m[2]).join(';');
  const nascosto = (sel) => /display:\s*none/.test(regola(sel));
  verifica(nascosto('[data-prezzi]:not([data-periodo]) .interruttore') && nascosto('[data-prezzi]:not([data-periodo]) .piano-prezzo-mese'), 'senza script niente interruttore e niente secondo prezzo: restano i due prezzi insieme');
  verifica(nascosto('[data-prezzi][data-periodo] .piano-oppure'), 'con lo script «oppure … al mese.» sparisce dalle schede');
  verifica(nascosto('[data-prezzi][data-periodo="anno"] .piano-prezzo-mese') && nascosto('[data-prezzi][data-periodo="mese"] .piano-prezzo-anno'), 'un prezzo alla volta, quello scelto');
  const riga = regola('[data-prezzi][data-periodo="mese"] .piano-risparmio');
  verifica(/visibility:\s*hidden/.test(riga) && !/display/.test(riga), 'con il mensile la riga del risparmio non si vede ma tiene il suo spazio', riga);
  const regalo = regola('[data-prezzi][data-periodo="mese"] .piano-regalo');
  verifica(/visibility:\s*hidden/.test(regalo) && !/display/.test(regalo), 'con il mensile la riga del regalo non si vede ma tiene il suo spazio', regalo);
  // Ogni regola che nomina il regalo, anche dentro le @media: l'unica che lo nasconde è quella del mensile,
  // quindi con l'annuale e senza script il regalo si vede.
  const regoleRegalo = [...css.matchAll(/([^{}]*piano-regalo[^{}]*)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].split(',').map(x => x.trim()).filter(x => x.includes('piano-regalo')), corpo: m[2] }));
  const nascondono = regoleRegalo.filter(r => /display:\s*none|visibility:\s*hidden|opacity:\s*0(?![.\d])/.test(r.corpo)).flatMap(r => r.sel);
  verifica(regoleRegalo.length > 0 && JSON.stringify(nascondono) === JSON.stringify(['[data-prezzi][data-periodo="mese"] .piano-regalo']), "il regalo si nasconde solo con il mensile: con l'annuale e senza script si vede", nascondono);
  // Dove «l'anno, in un'unica soluzione» non sta accanto alla cifra, il periodo va sotto in tutte e tre le schede.
  const strette = /@media\s*\(max-width:\s*359px\),\s*\(min-width:\s*1024px\)\s*and\s*\(max-width:\s*1279px\)\s*\{[^{}]*\{[^{}]*flex-wrap:\s*wrap[^{}]*\}\s*\.piano-periodo\s*\{\s*flex-basis:\s*100%;?\s*\}/.test(css);
  verifica(strette, 'nelle schede strette (sotto i 360 px e fra 1024 e 1279 px) il periodo va sotto la cifra: le righe del prezzo restano uguali');
  // Sotto il mouse un piano non si sposta: le tre schede restano alla stessa altezza.
  const hover = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].split(',').map(x => x.trim()).includes('.piano:hover'));
  verifica(hover.length === 1 && /transform:\s*none/.test(hover[0][2]) && /border-color/.test(hover[0][2]) && hover[0][1].includes('.js .rv.in.piano:hover'), 'sotto il mouse un piano non si solleva: si distingue con ombra e bordo', hover.map(m => m[2]));
  // Le note: centrate, una sotto l'altra, in una colonna di 760 px al massimo; l'ultima più piccola e più chiara, senza riga.
  const note = regola('.piani-note'), righe = regola('.piani-note li'), ultima = regola('.piani-note .piani-note-ultima');
  verifica(/align-items:\s*center/.test(note) && /text-align:\s*center/.test(note) && /flex-direction:\s*column/.test(note) && !/grid/.test(css.match(/\.piani-note\s*\{[^}]*\}/g).join(' ')), 'le note sono centrate, una sotto l\'altra (niente colonne)', note);
  verifica(/max-width:\s*760px/.test(righe), 'le note stanno in una colonna larga al massimo 760 px', righe);
  verifica(/color:\s*var\(--muto\)/.test(ultima) && !/border/.test(css.match(/[^{}]*piani-note-ultima[^{}]*\{[^}]*\}/g).join(' ')), 'l\'ultima nota è più chiara e senza riga di separazione', ultima);
  const corpi = [...css.matchAll(/\.piani-note \.piani-note-ultima\s*\{[^}]*font-size:\s*([\d.]+)px/g)].map(m => +m[1]);
  const corpiNote = [...css.matchAll(/\.piani-note\s*\{[^}]*font-size:\s*([\d.]+)px/g)].map(m => +m[1]);
  verifica(corpi.length === 2 && corpiNote.length === 2 && corpi.every((c, i) => c < corpiNote[i]), `l'ultima nota è più piccola delle altre, sul telefono e sul computer (${corpi.join('/')} contro ${corpiNote.join('/')} px)`);
  const insieme = [...css.matchAll(/([^{}]+)\{/g)].map(m => m[1].split(',').map(x => x.trim())).filter(s => s.includes('.piano-mese') && s.includes('.piano .piano-regalo'));
  verifica(insieme.length === 2, 'la riga del regalo ha lo stile della riga del risparmio (le stesse regole di .piano-mese, sul telefono e sul computer)', insieme.length);
  verifica(/setAttribute\('data-periodo', periodo\)/.test(JS_CODICE) && /setAttribute\('aria-pressed'/.test(JS_CODICE) && /scegli\('anno'\)/.test(JS_CODICE), "lo script scrive data-periodo e aria-pressed, e parte dall'annuale");
}

console.log('\n9. Le domande frequenti');
{
  const elenco = conClasse('domande');
  verifica(elenco.length === 1, 'le domande stanno in un elenco solo');
  const domande = tag.filter(t => classi(t).includes('domanda'));
  verifica(domande.length === DOMANDE.length && domande.every(d => d.nome === 'details' && d.antenati.includes(elenco[0])), `ogni domanda è un <details> (${domande.length})`, domande.map(d => d.nome));
  verifica(domande.every(d => !('open' in d.attr)), "all'apertura della pagina sono tutte chiuse");
  const titoli = domande.map(d => {
    const s = tag.filter(t => t.nome === 'summary' && t.antenati.includes(d));
    const h = s.length === 1 ? tag.filter(t => t.nome === 'h3' && t.antenati.includes(s[0])) : [];
    return h.length === 1 ? testoDi(h[0]) : null;
  });
  verifica(JSON.stringify(titoli) === JSON.stringify(DOMANDE), "il titolo di ogni domanda è nella sua riga (<summary>), nel loro ordine (le due sulle letture dopo «Quanto costa dopo la prova?»)", titoli);
  const segni = domande.map(d => tag.filter(t => t.antenati.includes(d) && classi(t).includes('domanda-segno')));
  verifica(segni.every(s => s.length === 1 && s[0].attr['aria-hidden'] === 'true' && !testoDi(s[0])), 'ogni riga ha il suo «+», solo disegnato (aria-hidden)');
  const risposte = domande.map(d => tag.filter(t => t.nome === 'p' && t.antenati.includes(d)).map(testoDi));
  verifica(risposte.every(r => r.length === 1 && r[0]), 'ogni domanda ha la sua risposta');
  const sicura = risposte[DOMANDE.indexOf(TESTI.sicuroDomanda)];
  verifica(sicura?.[0] === TESTI.sicuroRisposta, `«${TESTI.sicuroDomanda}»: la risposta di sempre`, sicura);
  // Le risposte nuove (6/10), parola per parola.
  const nuove = [
    ['Che cosa succede alla fine della prova?', TESTI.fineProva],
    ['Quanto costa dopo la prova?', TESTI.costo],
    [TESTI.lettureDomanda, TESTI.lettureRisposta],
    [TESTI.pacchettiDomanda, TESTI.pacchettiRisposta],
  ];
  for (const [d, r] of nuove) {
    const data = risposte[DOMANDE.indexOf(d)];
    verifica(data?.[0] === r, `«${d}»: la risposta approvata`, data);
  }
  // Le altre non cambiano.
  for (const [d, r] of Object.entries(RISPOSTE_DI_SEMPRE)) {
    const data = risposte[DOMANDE.indexOf(d)];
    verifica(data?.[0] === r, `«${d}»: la risposta di sempre`, data);
  }
}

console.log(`\n${passati} passati, ${falliti} falliti`);
process.exit(falliti ? 1 : 0);
