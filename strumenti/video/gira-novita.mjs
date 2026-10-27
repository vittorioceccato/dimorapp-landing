// I cinque minivideo delle novità nella veste nuova (sesto giro, 27/10/2026): imu-calcolata, rate-condominio,
// pacchetto-commercialista, bonus-casa, carichi-al-resto. Le scene e le tappe sono quelle dell'app
// (scripts/novita-video/gira.ts: stessi dati inventati, stessa sequenza, stessa durata); qui cambia solo il montaggio,
// perché su questo computer ffmpeg non c'è. In due tempi:
//
//   1. node gira-novita.mjs prepara <copia-dell-app>
//        Nella COPIA dell'app (mai nel repository di lavoro) accende la veste nuova sulle scene (accendi-veste.mjs) e
//        cambia il montaggio di gira.ts: invece di chiamare ffmpeg scrive, per ogni video, le fotografie (png) e le
//        tappe (tappe.json) nella cartella della variabile VIDEO_DUMP. Poi, nella copia:
//          VIDEO_DUMP=<cartella> node --import tsx scripts/novita-video/gira.ts imu-calcolata rate-condominio ...
//        (next dev su 127.0.0.1 con sole variabili finte, Chrome senza finestra con un profilo temporaneo: gira.ts).
//
//   2. node gira-novita.mjs monta <moduli> <copia-dell-app> <cartella VIDEO_DUMP> <uscita>
//        Monta i fotogrammi come li montava gira.ts (sosta, passaggio morbido o dissolvenza, il contorno che entra in
//        0,4 secondi, l'ultima tappa che torna alla prima) e li codifica in H.264 nel browser (WebCodecs, mp4-muxer),
//        come gira-affitti.mjs. Esce per ogni video <id>.mp4 (960×600, 25 fotogrammi al secondo, muto, sotto 1 MB),
//        <id>.jpg e <id>.webp (le locandine, il primo fotogramma). Si copiano in assets/novita/.
//
// <moduli>: una cartella con node_modules/puppeteer-core e node_modules/mp4-muxer (installati fuori da questo
// repository); da <copia-dell-app> si prende sharp. Dati tutti inventati (dati.ts dell'app: Laura Bianchi, la Casa al
// mare, la Residenza dei Glicini); l'unico dato vero è il prospetto IMU pubblico di Alassio.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [modo, ...arg] = process.argv.slice(2);
const QUI = path.dirname(fileURLToPath(import.meta.url));

if (modo === 'prepara') {
  const copia = arg[0];
  const gira = path.join(copia || '', 'scripts/novita-video/gira.ts');
  if (!copia || !fs.existsSync(gira)) throw new Error('uso: node gira-novita.mjs prepara <copia-dell-app>');
  if (fs.existsSync(path.join(copia, '.git'))) throw new Error('La cartella ha un .git: si lavora su una copia esportata.');
  const r = spawnSync(process.execPath, [path.join(QUI, 'accendi-veste.mjs'), copia], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('accendi-veste non è riuscito');
  let s = fs.readFileSync(gira, 'utf8');
  if (!s.includes('GIRA-NOVITA')) {
    const a = s.indexOf('async function monta(id: string, tappe: Tappa[])');
    const b = s.indexOf('// ── Le storie');
    if (a < 0 || b < a) throw new Error('gira.ts: non trovo il montaggio da sostituire');
    s = s.slice(0, a) + `async function monta(id: string, tappe: Tappa[]): Promise<{ mp4: string; jpg: string; peso: number; secondi: number }> {
  // GIRA-NOVITA (landing, sesto giro): niente ffmpeg. Le fotografie (png) e le tappe (tappe.json) per il montaggio
  // della landing (strumenti/video/gira-novita.mjs monta); il contorno in coordinate della parte visibile.
  const cartella = path.join(process.env.VIDEO_DUMP ?? path.join(RADICE, 'video-dump'), id)
  mkdirSync(cartella, { recursive: true })
  const nomi = new Map<Foto, string>()
  for (const t of tappe) {
    if (nomi.has(t.foto)) continue
    const nome = \`foto-\${nomi.size}.png\`
    await sharp(t.foto.raw, { raw: { width: t.foto.larghezza, height: t.foto.altezza, channels: 3 } }).png().toFile(path.join(cartella, nome))
    nomi.set(t.foto, nome)
  }
  writeFileSync(path.join(cartella, 'tappe.json'), JSON.stringify(tappe.map(t => ({
    foto: nomi.get(t.foto), quadro: t.quadro, resta: t.resta, passa: t.passa,
    evidenzia: t.evidenzia ? { x: t.evidenzia.x, y: t.evidenzia.y - t.foto.scrollY, w: t.evidenzia.w, h: t.evidenzia.h } : null,
  }))))
  return { mp4: cartella, jpg: cartella, peso: 0, secondi: tappe.reduce((x, t) => x + Math.round(t.resta * FPS) + Math.round(t.passa * FPS), 0) / FPS }
}

` + s.slice(b);
    s = s.replace(/\n\s*if \(spawnSync\(FFMPEG, \['-version'\]\)\.status !== 0\)[^\n]*/, '');
    fs.writeFileSync(gira, s);
  }
  console.log('pronta:', gira, s.includes('GIRA-NOVITA') ? '(montaggio senza ffmpeg)' : '');
} else if (modo === 'monta') {
  const [MODULI, APP, DUMP, OUT] = arg;
  if (!MODULI || !APP || !DUMP || !OUT) throw new Error('uso: node gira-novita.mjs monta <moduli> <copia-dell-app> <dump> <uscita>');
  const daModuli = createRequire(path.join(MODULI, 'package.json'));
  const puppeteer = daModuli('puppeteer-core');
  const sharp = createRequire(path.join(APP, 'package.json'))('sharp');
  const MUXER = fs.readFileSync(path.join(MODULI, 'node_modules/mp4-muxer/build/mp4-muxer.js'), 'utf8');
  fs.mkdirSync(OUT, { recursive: true });
  const W = 960, H = 600, FPS = 25, DENSITA = 2;
  // WebCodecs vuole un indirizzo sicuro: una pagina vuota su 127.0.0.1, servita da qui.
  const server = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end('<!doctype html><title>montaggio</title>'); });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'dimora-montaggio-')), args: ['--no-first-run', '--no-default-browser-check'],
  });
  try {
    const ids = fs.readdirSync(DUMP).filter((d) => fs.existsSync(path.join(DUMP, d, 'tappe.json')));
    for (const id of ids) {
      const tappe = JSON.parse(fs.readFileSync(path.join(DUMP, id, 'tappe.json'), 'utf8'));
      const foto = {};
      for (const t of tappe) if (!foto[t.foto]) foto[t.foto] = 'data:image/png;base64,' + fs.readFileSync(path.join(DUMP, id, t.foto)).toString('base64');
      const p = await browser.newPage();
      await p.goto(`http://127.0.0.1:${server.address().port}/`);
      await p.evaluate((W, H) => { document.body.innerHTML = `<canvas id="t" width="${W}" height="${H}"></canvas>`; }, W, H);
      await p.addScriptTag({ content: MUXER });
      const ris = await p.evaluate(async ({ tappe, foto, W, H, FPS, DENSITA }) => {
        const carica = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
        const img = {};
        for (const k of Object.keys(foto)) img[k] = await carica(foto[k]);
        const tela = document.getElementById('t'), g = tela.getContext('2d');
        g.imageSmoothingQuality = 'high';
        const morbido = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const disegna = (i, q, a = 1) => { g.globalAlpha = a; const h = q.w * H / W; g.drawImage(i, q.x * DENSITA, q.y * DENSITA, q.w * DENSITA, h * DENSITA, 0, 0, W, H); g.globalAlpha = 1; };
        // Il contorno 5 pixel fuori dal punto che conta, nel colore della porta (veste nuova).
        const contorno = (q, r, a) => {
          if (!r || a <= 0) return;
          const k = W / q.w;
          g.save(); g.globalAlpha = a; g.lineWidth = 3; g.strokeStyle = 'rgb(206,127,51)'; g.fillStyle = 'rgba(206,127,51,0.12)';
          g.beginPath(); g.roundRect((r.x - 5 - q.x) * k, (r.y - 5 - q.y) * k, (r.w + 10) * k, (r.h + 10) * k, 8); g.fill(); g.stroke(); g.restore();
        };
        // La stessa sequenza del montaggio di gira.ts: per ogni tappa la sosta, poi il passaggio verso la seguente;
        // l'ultima torna alla prima, così il giro del video si chiude senza uno stacco.
        const quadri = [];
        tappe.forEach((a, n) => {
          const b = tappe[(n + 1) % tappe.length];
          const fermi = Math.round(a.resta * FPS);
          for (let i = 0; i < fermi; i++) quadri.push(() => { disegna(img[a.foto], a.quadro); contorno(a.quadro, a.evidenzia, Math.min(1, i / (0.4 * FPS))); });
          const passi = Math.round(a.passa * FPS);
          for (let i = 1; i <= passi; i++) {
            const t = morbido(i / passi);
            if (a.foto === b.foto) {
              const q = { x: a.quadro.x + (b.quadro.x - a.quadro.x) * t, y: a.quadro.y + (b.quadro.y - a.quadro.y) * t, w: a.quadro.w + (b.quadro.w - a.quadro.w) * t };
              quadri.push(() => disegna(img[a.foto], q));
            } else {
              quadri.push(() => { disegna(img[a.foto], a.quadro); disegna(img[b.foto], b.quadro, t); });
            }
          }
        });
        let locandina = null;
        for (const bitrate of [900000, 700000, 520000]) {
          const target = new Mp4Muxer.ArrayBufferTarget();
          const muxer = new Mp4Muxer.Muxer({ target, video: { codec: 'avc', width: W, height: H, frameRate: FPS }, fastStart: 'in-memory' });
          const enc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { throw e; } });
          enc.configure({ codec: 'avc1.640028', width: W, height: H, bitrate, framerate: FPS, latencyMode: 'quality', avc: { format: 'avc' } });
          for (let i = 0; i < quadri.length; i++) {
            g.fillStyle = '#FAF3E3'; g.fillRect(0, 0, W, H);
            quadri[i]();
            if (i === 0 && !locandina) locandina = tela.toDataURL('image/png');
            const f = new VideoFrame(tela, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
            enc.encode(f, { keyFrame: i % (FPS * 2) === 0 });
            f.close();
            if (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 0));
          }
          await enc.flush();
          muxer.finalize();
          const buf = new Uint8Array(target.buffer);
          if (buf.length < 1000000 || bitrate === 520000) {
            let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
            return { mp4: btoa(s), locandina, secondi: quadri.length / FPS, peso: buf.length };
          }
        }
      }, { tappe, foto, W, H, FPS, DENSITA });
      await p.close();
      fs.writeFileSync(path.join(OUT, `${id}.mp4`), Buffer.from(ris.mp4, 'base64'));
      const png = Buffer.from(ris.locandina.split(',')[1], 'base64');
      await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${id}.jpg`));
      await sharp(png).webp({ quality: 82 }).toFile(path.join(OUT, `${id}.webp`));
      console.log(`${id}: ${(ris.peso / 1024).toFixed(0)} KB, ${ris.secondi.toFixed(2)} s`);
    }
  } finally {
    await browser.close();
    server.close();
  }
} else {
  throw new Error('uso: node gira-novita.mjs prepara <copia-dell-app> | monta <moduli> <copia-dell-app> <dump> <uscita>');
}
