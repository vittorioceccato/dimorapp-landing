// LE STORIE DELLE NOVITÀ, PER LA LANDING (25/10/2026) — una fonte sola per il racconto della pagina, le carte di
// ottobre e le pagine degli articoli (novita/*.html, scritte da strumenti/genera-articoli.mjs). Il controllo
// (controlli/controllo.mjs) confronta la pagina con questo file.
//
// I TESTI SONO QUELLI DELLA REGIA, parola per parola: NOVITA_TESTI_V2_2026-10-23.md per titolo e testo breve,
// NOVITA_ARTICOLI_2026-10-24.md (versione del 25/10, 10:45: corrette S2, S3, S5 e S6 sulle frasi che il codice non
// confermava) per gli articoli. Titoli e testi brevi coincidono con lib/novita.ts dell'app (ramo `novita`, a0f300e);
// gli articoli di S2, S3, S5 e S6 nell'app sono ancora quelli di prima della correzione.
//
// Nell'articolo pubblico l'azione dell'app («Guarda la tua IMU») diventa «Prova Dimora gratis», e l'etichetta
// personale non c'è. L'ordine dell'elenco è l'ordine del racconto.

export const STORIE = [
  {
    id: 'imu-calcolata',
    uscita: '2026-10-17',
    titolo: "L'IMU, calcolata.",
    testo: 'Dimora trova le aliquote del tuo Comune e calcola acconto e saldo. Tiene conto di box, cantine e della tua quota, e calcola il saldo su quello che hai già versato. Tu controlli e paghi.',
    carta: true,
    articolo: {
      rigaSotto: 'Sai per tempo quanto pagherai, casa per casa, e anno dopo anno vedi quanto hai speso.',
      perche: [
        "Ogni anno, a giugno e a dicembre, torna la stessa domanda: quanto devo pagare di IMU per la casa al mare? E per il box? Per molti la risposta arriva solo con l'F24 del commercialista o del CAF, pochi giorni prima della scadenza. Così è difficile mettere da parte la cifra per tempo, e quasi nessuno sa dire quanto ha pagato l'anno scorso o se quest'anno paga di più.",
        "Eppure non è una spesa piccola: per una seconda casa nei capoluoghi si pagano in media 977 euro l'anno, da 391 euro a Palermo fino a 3.499 euro a Roma. E non è un conto semplice: in Italia ci sono 7.894 Comuni e ognuno decide le sue aliquote. Fino al 2024 le combinazioni possibili erano circa 250.000; dal 2025 i Comuni scelgono fra 128 casi fissati dal Ministero dell'Economia. Più ordine, ma il conto resta da fare.",
      ],
      passi: [
        'Dimora prende le aliquote dal prospetto ufficiale del tuo Comune.',
        'Le applica alla rendita della casa, dei box e delle cantine, per la tua quota e per i mesi in cui la possiedi.',
        "Ti mostra acconto e saldo, e li mette nelle scadenze. Se hai già pagato l'acconto, il saldo di dicembre lo calcola su quello che hai versato. Quando paghi, l'IMU entra nei costi della casa: anno dopo anno sai quanto hai speso.",
      ],
      alComando: "Vedi sempre da quale delibera viene l'aliquota e come è fatto il conto. Se un dato non torna lo cambi, e Dimora rifà il calcolo. Il pagamento lo fai tu, con la stima sotto gli occhi.",
      fonti: [
        { titolo: 'UIL, «Studio su saldo IMU 2025», costo totale annuo per una seconda casa nei capoluoghi con rendita media', indirizzi: ['https://www.uil.it/documents/Uil_%20su_Imu_saldodicembre2025.pdf'] },
        { titolo: 'ISTAT, numero dei Comuni al 21 febbraio 2026', indirizzi: ['https://www.istat.it/it/archivio/6789'] },
        {
          titolo: 'Decreto MEF del 6 settembre 2024, da circa 250.000 combinazioni a 128 fattispecie',
          indirizzi: [
            'https://www.leggioggi.it/imu-semplificata-dal-2025-nuove-aliquote/',
            'https://www.brocardi.it/notizie-giuridiche/riforma-2025-taglio-delle-aliquote-semplificazioni-comuni-cittadini/4538.html',
          ],
        },
      ],
    },
  },
  {
    id: 'rate-condominio',
    uscita: '2026-10-23',
    titolo: 'Le rate del condominio, in ordine.',
    testo: 'Carichi il preventivo: Dimora trova le tue rate e le mette nelle scadenze.',
    carta: true,
    articolo: {
      rigaSotto: 'Carichi il preventivo: Dimora trova le tue rate e te le ricorda.',
      perche: [
        "Arriva il bilancio preventivo del condominio: venti pagine di tabelle, e da qualche parte c'è la tua riga. Dove lo salvi? E le rate, come te le ricordi? A volte ci pensa l'amministratore con un avviso, a volte no. C'è chi se le segna su un foglietto, chi le paga tutte subito per paura di dimenticarle. E a fine anno, quanto hai speso di condominio? Pochi lo sanno dire senza riaprire gli estratti conto.",
        'Non è un problema di pochi: in Italia oltre 45 milioni di persone vivono in condominio, e i condomini registrati sono circa 1,2 milioni.',
      ],
      passi: [
        'Carichi il preventivo, anche un PDF di venti pagine. Dimora lo riconosce e lo distingue dal consuntivo: il preventivo prepara le rate, il consuntivo resta fra i documenti della casa.',
        'Il nostro motore di lettura cerca la tua riga fra tutte quelle del palazzo, anche se hai più di un appartamento, un box o una cantina, e prende le tue rate con le loro date.',
        'Le rate finiscono nelle scadenze e te le ricordiamo. Quando le paghi, entrano nei costi della casa: a fine anno sai quanto hai speso.',
      ],
      alComando: 'Prima di salvare vedi la riga che Dimora ha trovato e le rate che propone. Se non è la tua, la cambi con un tocco. Se il documento è fatto in un modo particolare, le rate le inserisci tu, con le righe già preparate.',
      fonti: [
        {
          titolo: 'Consiglio Nazionale del Notariato con ANACI e associazioni dei consumatori, guida «Vivere in condominio», 19 aprile 2023, oltre 45 milioni di italiani in condominio e circa 1,2 milioni di condomini registrati con il modello 770',
          indirizzi: ['https://www.italpress.com/vivere-in-condominio-arriva-la-guida-del-notariato/'],
        },
      ],
    },
  },
  {
    id: 'carichi-al-resto',
    uscita: '2026-10-25',
    titolo: 'Carichi, al resto pensa Dimora.',
    testo: "Fotografi le pagine una per una o carichi un PDF: Dimora ricostruisce il documento, capisce che cos'è e ti avvisa se l'avevi già caricato.",
    carta: true,
    articolo: {
      rigaSotto: 'Un documento da più foto, i doppioni riconosciuti, ogni file al suo posto.',
      perche: [
        "Il contratto è in un cassetto, di carta, e lo fotografi pagina per pagina. La bolletta arriva per mail, il preventivo del condominio è un PDF di venti pagine. Alla fine hai dieci file sparsi e una domanda: l'avevo già caricato? E questa foto, di quale documento era?",
        'Quanti documenti della casa hai nel telefono, fra foto e allegati? E quanti sapresti ritrovare in un minuto?',
      ],
      passi: [
        'Un documento alla volta, anche da più file: fotografi le pagine una per una o aggiungi le pagine che mancano, e Dimora le mette insieme in un documento solo.',
        'Se carichi insieme file diversi, per esempio un PDF e una foto, Dimora ti chiede se sono lo stesso documento prima di leggerli.',
        "Se un file l'avevi già caricato, Dimora te lo dice subito: se è ancora da confermare lo riprendi o lo sostituisci, se è già archiviato lo apri. E se un pagamento sembra uguale a uno che c'è già, te lo chiede prima di contarlo due volte.",
        "Dimora capisce di che documento si tratta, fra più di cento tipi (contratto, rogito, visura, bolletta, preventivo, polizza…), e lo mette nell'area giusta della casa giusta.",
      ],
      alComando: "Prima di salvare vedi sempre che cosa ha capito Dimora: il tipo, la casa, le cifre. Lo cambi con un tocco. E se un documento non vuoi farlo leggere, lo archivi così com'è.",
      fonti: [],
      // Al posto delle fonti (la «Nota interna» del file della regia non si mostra).
      senzaFonti: 'Senza fonti: in questo articolo non ci sono dati esterni, solo domande.',
    },
  },
  {
    id: 'pacchetto-commercialista',
    uscita: '2026-10-20',
    titolo: 'Al commercialista, un pacchetto pronto.',
    testo: 'Per ogni casa e ogni anno, i documenti utili per la dichiarazione e un riepilogo in PDF e in tabella, pronti da mandare. Dimora ti dice anche quali non trova.',
    carta: true,
    articolo: {
      rigaSotto: 'I documenti della casa per la dichiarazione, raccolti per te, anno per anno.',
      perche: [
        "Maggio, si avvicina la dichiarazione. Il commercialista chiede: il contratto d'affitto, le ricevute dei canoni, le fatture dei lavori, i bonifici, la certificazione degli interessi del mutuo. E inizia la caccia fra mail, cassetti e cartelle del computer. Qualcosa si trova, qualcosa no, qualcosa si trova a giugno.",
        "La precompilata aiuta: quest'anno l'Agenzia delle Entrate ci ha caricato circa 1,3 miliardi di dati. Ma solo il 41% dei 730 semplificati è stato accettato così com'era: per tutti gli altri qualcosa andava aggiunto o corretto. E i documenti della casa sono spesso proprio quelli che mancano.",
      ],
      passi: [
        'Per ogni casa e ogni anno Dimora raccoglie i documenti utili per la dichiarazione fra quelli che hai caricato.',
        'Ti dice quali non trova in Dimora, così sai cosa cercare prima e non a giugno.',
        "Prepara un pacchetto con gli originali e un riepilogo in PDF e in tabella, pronto da mandare. Per le case in affitto calcola anche il canone dei giorni di affitto dell'anno.",
      ],
      alComando: "Scegli tu cosa mandare: spunti, togli, aggiungi. Dimora ricorda le tue scelte per quell'anno. Il commercialista riceve tutto in ordine e decide lui come usarlo.",
      fonti: [
        { titolo: 'Agenzia delle Entrate, precompilata 2025, circa 1,3 miliardi di dati', indirizzi: ['https://tg24.sky.it/economia/2025/04/30/precompilata-2025-dichiarazione-redditi-730-agenzia-entrate'] },
        {
          titolo: 'Comunicato del 25 settembre 2025, il 41% dei 730 semplificati accettato senza modifiche',
          indirizzi: ['https://www.informazionefiscale.it/IMG/pdf/055_com._st._730_precompilato_in_dirittura_d_arrivo_25.09_2025.pdf'],
        },
      ],
    },
  },
  {
    id: 'bonus-casa',
    uscita: '2026-10-14',
    titolo: 'I bonus della casa: cosa controllare.',
    testo: 'Quando carichi un preventivo, una fattura o un bonifico, Dimora ti dice cosa controllare per ristrutturazione, ecobonus, bonus mobili e interessi del mutuo. Decide il commercialista.',
    carta: true,
    articolo: {
      rigaSotto: 'Dal preventivo al bonifico, Dimora ti dice cosa serve per non perdere la detrazione.',
      perche: [
        "Hai cambiato le finestre, la caldaia, hai comprato una cucina nuova. Sai che c'è una detrazione, ma quale? Serviva il bonifico parlante o andava bene quello normale? Bisognava mandare qualcosa all'ENEA, ed entro quando? Spesso lo si scopre dopo, quando il commercialista guarda i documenti e qualcosa non torna.",
        "Sono domande di tanti: quest'anno nella precompilata sono arrivati 10,5 milioni di bonifici per ristrutturazioni e quasi 7,5 milioni di dati su lavori condominiali, il 32% in più dell'anno prima.",
      ],
      passi: [
        'Quando carichi un preventivo, una fattura o un bonifico, Dimora lo collega alle agevolazioni che possono riguardarlo: ristrutturazione, ecobonus, bonus mobili, interessi del mutuo.',
        "Ti dice cosa controllare, documento per documento: la causale del bonifico con numero e data della fattura, la comunicazione all'ENEA, i casi esclusi (come le caldaie a gas dal 2025).",
        'In Home una riga ti dice quante cose restano da controllare: «Bonus della casa: 3 cose da controllare, in 2 voci.»',
      ],
      alComando: 'Dimora ti segnala cosa guardare, con la fonte e la data in cui la regola è stata verificata. Quale bonus spetta al tuo caso lo decide il commercialista: tu gli arrivi con i documenti giusti.',
      fonti: [
        {
          titolo: 'Agenzia delle Entrate, precompilata 2025, 10,5 milioni di bonifici per ristrutturazioni e quasi 7,5 milioni di dati su ristrutturazioni condominiali (+32%)',
          indirizzi: ['https://tg24.sky.it/economia/2025/04/30/precompilata-2025-dichiarazione-redditi-730-agenzia-entrate'],
        },
      ],
    },
  },
  {
    // Nell'app la storia è solo per chi affitta; nella landing è nel racconto ma non fra le carte di ottobre
    // (NOVITA_TESTI_V2: carte S1-S4, più S6 «per la carta e la landing»).
    id: 'canone-a-meta',
    uscita: '2026-10-22',
    titolo: 'Il canone, anche quando arriva a metà.',
    testo: "Se l'inquilino paga solo una parte, la segni e Dimora tiene il conto di quello che manca.",
    carta: false,
    articolo: {
      rigaSotto: "Se l'inquilino paga solo una parte, Dimora tiene il conto di quello che manca.",
      perche: [
        "Il bonifico arriva, ma è di 400 euro invece di 600. «Il resto a fine mese», dice l'inquilino. Poi passa un mese, poi un altro, e ricordarsi chi deve cosa diventa un esercizio di memoria fra estratto conto e messaggi. Chi affitta lo sa: un ritardo piccolo, se nessuno lo segue, diventa grande.",
        'Non è un caso raro: nel 2024 in Italia sono stati convalidati 40.158 sfratti, e tre su quattro erano per morosità.',
      ],
      passi: [
        'Segni il canone come incassato con un tocco, dalla scheda della casa o da Incassi.',
        'Se arriva meno, scrivi la cifra vera: Dimora tiene il resto da incassare sulla stessa rata.',
        'Quando arriva il resto lo segni, e il mese è chiuso. Le rate scoperte restano in evidenza finché non sono a posto.',
      ],
      alComando: "Le cifre le scrivi tu, come le vedi sul conto. Con l'incasso automatico Dimora segna il canone ogni mese, e se non arriva tocchi «Non è arrivato».",
      fonti: [
        {
          titolo: "SICET su dati del Ministero dell'Interno, sfratti in Italia 2001-2024: 40.158 convalidati nel 2024, 30.041 per morosità",
          indirizzi: ['https://www.cisl.it/wp-content/uploads/2025/09/Sfratti-Italia-serie-storica-2001-24.pdf'],
        },
      ],
    },
  },
];

// Le parole intorno, come nell'app (lib/novita.ts: PARTI_ARTICOLO, LEGGI_ARTICOLO, firmaArticolo).
export const PARTI = {
  perche: "Perché l'abbiamo fatto",
  passi: 'Con Dimora abbiamo pensato anche a questo',
  alComando: 'Sei tu al comando',
  fonti: 'Fonti',
  leggi: "Leggi l'articolo",
  firma: 'Il team di Dimora · ottobre 2026',
  azione: 'Prova Dimora gratis',
};

// La sezione delle novità nella landing (NOVITA_TESTI_V2: N26, N27 e l'etichetta delle carte).
export const NOVITA_LANDING = {
  titolo: 'Ogni mese, qualcosa in meno a cui pensare',
  testo: 'Ogni mese il team di Dimora aggiunge qualcosa di nuovo. Ecco le novità di ottobre.',
  etichetta: 'Nuovo · ottobre 2026',
};

export const ORIGINE = 'https://dimorapp.com';
export const ISCRIZIONE = 'https://app.dimorapp.com/login';
export const indirizzoArticolo = (id) => `/novita/${id}`;
