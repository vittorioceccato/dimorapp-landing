// I tre minivideo di «Se affitti una casa» (quinto giro, 27/10/2026), dalla copia dell'app con DATI INVENTATI:
//   contratto-letto  la lettura di un contratto 4+4 (Giulia Conti, € 650) fino a «Salva il contratto e crea le scadenze»;
//   carta-contratto  la carta del contratto nella scheda della casa, fino alla riga della disdetta;
//   canoni-mese      la rata del mese: «Segna incassati», l'incasso intero, poi uno in parte.
//
//   node gira-affitti.mjs <moduli> <copia-dell-app> <uscita>
//
// <moduli>: una cartella con node_modules/puppeteer-core e node_modules/mp4-muxer (installati fuori da questo
// repository); <copia-dell-app>: la copia temporanea dell'app (vedi strumenti/foto-app/LEGGIMI.md), con le scene di
// strumenti/foto-app/scena in app/auth/foto-landing/ e `next dev` acceso su 127.0.0.1:3292 con le sole variabili finte;
// da lì si prende anche sharp. Esce, per ogni video: <id>.mp4 (H.264, 960×600, 25 fotogrammi al secondo, muto, sotto
// 1 MB) e <id>.webp (la locandina, il primo fotogramma). Si copiano in assets/video/ della landing.
//
// Su questo computer ffmpeg non c'è: l'mp4 lo codifica Chrome (WebCodecs, H.264) e lo impacchetta mp4-muxer, nella
// pagina. Chrome si apre SENZA FINESTRA, con un profilo suo in una cartella temporanea.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [MODULI, APP, OUT] = process.argv.slice(2);
if (!MODULI || !APP || !OUT) throw new Error('uso: node gira-affitti.mjs <moduli> <copia-dell-app> <uscita>');
const daModuli = createRequire(path.join(MODULI, 'package.json'));
const puppeteer = daModuli('puppeteer-core');
const sharp = createRequire(path.join(APP, 'package.json'))('sharp');
const MUXER = fs.readFileSync(path.join(MODULI, 'node_modules/mp4-muxer/build/mp4-muxer.js'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://127.0.0.1:3292/auth/foto-landing';
const LARGO = 1280, ALTO = 800, DENSITA = 2, W = 960, H = 600, FPS = 25;
const dormi = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'dimora-video-')),
  args: ['--no-first-run', '--no-default-browser-check'],
});

async function apri(indirizzo) {
  const p = await browser.newPage();
  await p.setViewport({ width: LARGO, height: ALTO, deviceScaleFactor: DENSITA });
  await p.goto(BASE + indirizzo, { waitUntil: 'networkidle0', timeout: 180000 });
  await p.waitForSelector('[data-pronto="si"]', { timeout: 60000 });
  await dormi(1500);
  return p;
}
const foto = async (p) => 'data:image/png;base64,' + (await p.screenshot({ encoding: 'base64' }));
// Il rettangolo (coordinate della finestra) del primo elemento che `trova` restituisce.
const rett = (p, trova) => p.evaluate((t) => { const el = (0, eval)(t); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, trova);
const conTesto = (testo, dentro = 'body') => `[...document.querySelectorAll('${dentro} *')].filter((e) => e.childElementCount === 0 && /${testo}/.test(e.textContent)).pop()`;
// L'inquadratura che contiene il rettangolo, larga almeno `minimo`, nelle proporzioni del video, dentro la finestra.
function inquadra(r, margine = 24, minimo = 420) {
  const w = Math.min(LARGO, Math.max(minimo, r.w + 2 * margine, (r.h + 2 * margine) * W / H));
  const h = w * H / W;
  const x = Math.max(0, Math.min(LARGO - w, r.x + r.w / 2 - w / 2));
  const y = Math.max(0, Math.min(ALTO - h, r.y + r.h / 2 - h / 2));
  return { x, y, w };
}

// ── Le tappe di ogni video: una fotografia, l'inquadratura, quanto resta, quanto dura il passaggio, cosa evidenziare.
async function contrattoLetto() {
  const p = await apri('?vista=contratto');
  const prima = await foto(p);
  // Il modulo scorre fino ai dati del contratto (come in strumenti/foto-app/fotografa.mjs).
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('body *')].filter((x) => x.textContent.trim() === 'Dati del contratto').pop();
    let c = el.parentElement;
    while (c && !(/(auto|scroll)/.test(getComputedStyle(c).overflowY) && c.scrollHeight > c.clientHeight)) c = c.parentElement;
    if (c) c.scrollTop += el.getBoundingClientRect().top - c.getBoundingClientRect().top - 12;
  });
  await dormi(800);
  const dati = await foto(p);
  const campi = await rett(p, conTesto('Dati del contratto'));
  // La conferma è montata due volte (telefono e computer): si prende la copia che si vede.
  const canone = await rett(p, `[...document.querySelectorAll('input')].find((i) => i.value === '650' && i.getBoundingClientRect().width > 0)`);
  const salva = await rett(p, `[...document.querySelectorAll('button')].find((b) => /Salva il contratto/.test(b.textContent) && b.getBoundingClientRect().width > 0)`);
  if (!canone || !salva) throw new Error('contratto-letto: canone o bottone non trovati');
  await p.close();
  const q2 = inquadra({ x: campi.x, y: campi.y, w: 620, h: 420 }, 16, 640);
  return [
    { foto: prima, quadro: { x: 300, y: 0, w: LARGO - 300 }, resta: 1.4, passa: 0.7 },
    { foto: dati, quadro: q2, resta: 1.6, passa: 0.9, evidenzia: canone },
    { foto: dati, quadro: inquadra({ x: salva.x, y: salva.y - 230, w: salva.w, h: salva.h + 230 }, 40, 640), resta: 2.4, passa: 0.6, evidenzia: salva },
  ];
}

async function cartaContratto() {
  const p = await apri('/affitto');
  const f = await foto(p);
  const carta = await rett(p, `document.querySelector('[data-inquadra="carta-affitto"]')`);
  const disdetta = await rett(p, conTesto('Disdetta entro', '[data-inquadra="carta-affitto"]'));
  await p.close();
  return [
    { foto: f, quadro: inquadra(carta, 32, 640), resta: 1.6, passa: 1.2 },
    { foto: f, quadro: inquadra({ x: carta.x, y: disdetta.y - 120, w: carta.w * 0.75, h: 200 }, 20, 440), resta: 2.8, passa: 0.6, evidenzia: disdetta },
  ];
}

async function canoniMese() {
  const tappe = [];
  const scrivi = async (importo) => {
    const p = await apri('/affitto?stato=da_incassare');
    const carta = await rett(p, `document.querySelector('[data-inquadra="carta-affitto"]')`);
    const bottone = await rett(p, `[...document.querySelectorAll('[data-inquadra="carta-affitto"] button')].find((b) => /Segna incassat/.test(b.textContent))`);
    const prima = await foto(p);
    await p.evaluate(() => [...document.querySelectorAll('[data-inquadra="carta-affitto"] button')].find((b) => /Segna incassat/.test(b.textContent)).click());
    await p.waitForSelector('[data-inquadra="carta-affitto"] input', { timeout: 10000 });
    await p.evaluate(() => { const c = document.querySelector('[data-inquadra="carta-affitto"] input'); c.focus(); c.select(); });
    await p.keyboard.type(importo, { delay: 60 });
    await dormi(500);
    const scritto = await foto(p);
    const cartaDopo = await rett(p, `document.querySelector('[data-inquadra="carta-affitto"]')`);
    await p.close();
    return { prima, scritto, carta, cartaDopo, bottone };
  };
  const stato = async (s) => { const p = await apri('/affitto' + (s ? '?stato=' + s : '')); const f = await foto(p); const c = await rett(p, `document.querySelector('[data-inquadra="carta-affitto"]')`); await p.close(); return { f, c }; };
  const intero = await scrivi('650');
  const incassato = await stato('');
  const parte = await scrivi('400');
  const parziale = await stato('parziale');
  const q = (c) => inquadra(c, 28, 600);
  tappe.push({ foto: intero.prima, quadro: q(intero.carta), resta: 1.2, passa: 0.5, evidenzia: intero.bottone });
  tappe.push({ foto: intero.scritto, quadro: q(intero.cartaDopo), resta: 1.4, passa: 0.6 });
  tappe.push({ foto: incassato.f, quadro: q(incassato.c), resta: 1.6, passa: 0.6 });
  tappe.push({ foto: parte.scritto, quadro: q(parte.cartaDopo), resta: 1.4, passa: 0.6 });
  tappe.push({ foto: parziale.f, quadro: q(parziale.c), resta: 2.4, passa: 0.6 });
  return tappe;
}

// ── Il montaggio, nella pagina: i fotogrammi su una tela, codificati in H.264 e impacchettati in mp4.
async function monta(id, tappe) {
  const p = await browser.newPage();
  // WebCodecs vuole un indirizzo sicuro: la pagina di montaggio sta su 127.0.0.1 (un indirizzo qualunque del server).
  await p.goto('http://127.0.0.1:3292/robots.txt');
  await p.evaluate((W, H) => { document.documentElement.innerHTML = `<body><canvas id="t" width="${W}" height="${H}"></canvas></body>`; }, W, H);
  await p.addScriptTag({ content: MUXER });
  const ris = await p.evaluate(async ({ tappe, W, H, FPS, DENSITA }) => {
    const carica = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    const immagini = new Map();
    for (const t of tappe) if (!immagini.has(t.foto)) immagini.set(t.foto, await carica(t.foto));
    const tela = document.getElementById('t'), g = tela.getContext('2d');
    const morbido = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const disegna = (img, q, a = 1) => { g.globalAlpha = a; const h = q.w * H / W; g.drawImage(img, q.x * DENSITA, q.y * DENSITA, q.w * DENSITA, h * DENSITA, 0, 0, W, H); g.globalAlpha = 1; };
    const contorno = (q, r, a) => {
      if (!r || a <= 0) return;
      const k = W / q.w;
      g.save(); g.globalAlpha = a; g.lineWidth = 3; g.strokeStyle = 'rgb(206,127,51)'; g.fillStyle = 'rgba(206,127,51,0.10)';
      g.beginPath(); g.roundRect((r.x - 5 - q.x) * k, (r.y - 5 - q.y) * k, (r.w + 10) * k, (r.h + 10) * k, 8); g.fill(); g.stroke(); g.restore();
    };
    const quadri = [];
    tappe.forEach((a, n) => {
      const b = tappe[(n + 1) % tappe.length];
      const fermi = Math.round(a.resta * FPS);
      for (let i = 0; i < fermi; i++) quadri.push(() => { disegna(immagini.get(a.foto), a.quadro); contorno(a.quadro, a.evidenzia, Math.min(1, i / (0.4 * FPS))); });
      if (n === tappe.length - 1) return; // l'ultima resta: il video ricomincia dalla prima
      const passi = Math.round(a.passa * FPS);
      for (let i = 1; i <= passi; i++) {
        const t = morbido(i / passi);
        if (a.foto === b.foto) {
          const q = { x: a.quadro.x + (b.quadro.x - a.quadro.x) * t, y: a.quadro.y + (b.quadro.y - a.quadro.y) * t, w: a.quadro.w + (b.quadro.w - a.quadro.w) * t };
          quadri.push(() => disegna(immagini.get(a.foto), q));
        } else {
          quadri.push(() => { disegna(immagini.get(a.foto), a.quadro); disegna(immagini.get(b.foto), b.quadro, t); });
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
  }, { tappe, W, H, FPS, DENSITA });
  await p.close();
  fs.writeFileSync(path.join(OUT, `${id}.mp4`), Buffer.from(ris.mp4, 'base64'));
  await sharp(Buffer.from(ris.locandina.split(',')[1], 'base64')).webp({ quality: 82 }).toFile(path.join(OUT, `${id}.webp`));
  console.log(`${id}: ${(ris.peso / 1024).toFixed(0)} KB, ${ris.secondi.toFixed(1)} s`);
}

try {
  await monta('contratto-letto', await contrattoLetto());
  await monta('carta-contratto', await cartaContratto());
  await monta('canoni-mese', await canoniMese());
} finally {
  await browser.close();
}
