# Le schermate dell'app nella landing (25/10/2026)

Le immagini, tutte nella veste nuova e con dati inventati (Mario Rossi, la casa di via dei Tigli a Padova, la casa al
mare, il bilocale in affitto; la bolletta è quella di `assets/img/foto-bolletta.webp`):

- `assets/img/app-computer.webp` (1280×800): le Scadenze dal computer, nell'apertura;
- `assets/img/app-computer-prima.webp` (1280×800): le stesse Scadenze senza la bolletta, il primo tempo della
  sequenza dell'apertura (vista `scadenze-prima` di `scena/Vista.tsx`);
- `assets/img/app-telefono.webp` (780×1688): la bolletta appena letta, dal telefono, nell'apertura;
- `assets/img/app-bolletta-computer.webp` (1280×800): la stessa lettura dal computer, nel passo delle bollette.

## Come si rifanno

1. Una copia dell'app, mai il repository di lavoro: `git -C <app> archive origin/main | tar -x -C <cartella>`, poi
   `npm ci` nella cartella.
2. `scena/page.tsx` e `scena/Vista.tsx` in `<cartella>/app/auth/foto-landing/` (sotto /auth/ il proxy non chiede
   l'accesso); `assets/img/foto-bolletta.webp` in `<cartella>/public/foto-landing-bolletta.webp`.
3. `next dev -H 127.0.0.1 -p 3292` nella cartella con le sole variabili finte (`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY=chiave-finta`): nessuna chiave vera.
4. `node fotografa.mjs <uscita>` (Chrome senza finestra, densità 2), poi `node converti.cjs <cartella> <uscita> assets/img`
   (sharp della copia, webp qualità 80).

La veste nuova la accende la scena stessa (`data-veste="nuova"` sulla cornice e sulla radice): nell'app la vede solo un
amministratore che l'ha accesa.
