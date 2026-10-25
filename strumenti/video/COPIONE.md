# I video delle novità nella veste nuova: il copione (25/10/2026)

I sei video di oggi (`assets/novita/<id>.mp4`) sono girati nella veste di prima. Restano finché non si rigirano. Questo
è il copione per rigirarli tutti con la veste nuova, con lo strumento dell'app (`scripts/novita-video/gira.ts`, nel
repository dell'app). Da qui non si gira niente: serve ffmpeg, che su questo computer non c'è.

## Come si gira

1. Una copia dell'app, mai il repository di lavoro: `git -C <app> archive origin/main | tar -x -C <cartella>`, poi
   `npm ci` nella cartella.
2. `node strumenti/video/accendi-veste.mjs <cartella>`: nelle scene della copia mette `data-veste="nuova"` sulla cornice
   e sulla radice, e sostituisce i colori scritti a mano delle scene con i colori della veste (le scene, non l'app).
3. `FFMPEG=<ffmpeg> node --import tsx scripts/novita-video/gira.ts` nella cartella, con le modifiche alle inquadrature
   qui sotto (in `gira.ts`, funzione per funzione).
4. I file escono in `public/novita/` della copia: si copiano in `assets/novita/` della landing (mp4 e jpg), e la locandina
   webp si rifà dal jpg (sharp, qualità 82).

## Le regole, per tutti e sei

- **Un movimento solo per video.** Un'inquadratura di partenza, uno spostamento o un avvicinamento, un'inquadratura di
  arrivo che resta ferma. Niente andata e ritorno, niente «tutto lo schermo» all'inizio.
- **Si legge al telefono.** Al telefono la finestra della landing è larga circa 370 px: un riquadro di 420 px di pagina
  (il `minimo` di `inquadra`) dà un testo di circa 11 px. Il riquadro non supera mai 420 px di pagina, salvo dove è
  scritto sotto.
- **La barra laterale fuori**, salvo S2 dove serve a dire dove siamo.
- 6-8 secondi, muto, in loop, sotto 1 MB, come oggi. L'ultima inquadratura resta almeno 2 secondi.
- I dati restano quelli inventati di `dati.ts` (Laura Bianchi, la Casa al mare, la Residenza dei Glicini).

## Video per video

| Video | Parte da | Il movimento | Arriva a |
|---|---|---|---|
| S1 `imu-calcolata` | la scheda IMU, su «Imposta dell'anno» | avvicinamento lento | acconto e saldo, con il saldo evidenziato (`€ 828,67`) |
| S2 `pacchetto-commercialista` | l'elenco «Documenti per la dichiarazione» (anno 2025) | scorre in basso | il riepilogo in PDF e tabella, con «Dimora non trova» |
| S3 `bonus-casa` | la voce dei lavori della caldaia, «Dati presenti» | scende | l'avviso del bonus, evidenziato |
| S4 `rate-condominio` | la riga «Int. 7» evidenziata nella tabella del preventivo | stacco netto (non un passaggio) | le tre rate fra le scadenze, ferme |
| S5 `canone-a-meta` | la carta dell'affitto, riquadro 480 px | nessun movimento: cambia lo stato | «Segna incassati» → 400 scritto → «il resto», in dissolvenza |
| S6 `carichi-al-resto` | l'elenco delle tre pagine | nessun movimento | la domanda «L'hai già caricato ieri», in dissolvenza |

Nel codice di `gira.ts`, per ognuno: togliere la prima tappa con `tutto(...)` (S1, S4), portare il `minimo` di
`inquadra` a 420 (S1 380 resta; S2, S3, S6 da 520-560 a 420; S4 da 640 a 420; S5 da 640 a 480) e lasciare due tappe:
partenza e arrivo. Le tappe che oggi evidenziano una terza cosa (la delibera in S1) passano all'articolo, dove c'è il
testo.

## Fuori da questo copione

- Le schermate ferme della landing (il computer e il telefono dell'apertura, la bolletta della seconda casa) sono già
  nella veste nuova: `strumenti/foto-app/` le rifà.
- Il passo delle bollette nella sezione della seconda casa non ha un video: se si vuole, un settimo video con la stessa
  scena delle schermate (la bolletta letta, il bottone «Registra la spesa e il promemoria»).
