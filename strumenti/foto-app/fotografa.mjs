// Fotografa le viste di /auth/foto-landing (copia temporanea dell'app, vedi LEGGIMI.md) per la landing.
// node fotografa.mjs <cartella-uscita>     (serve puppeteer-core, installato fuori da questo repository)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'dimora-foto-')),
  args: ['--no-first-run', '--no-default-browser-check'],
});
const viste = [
  { nome: 'computer', vista: 'scadenze', w: 1280, h: 800 },
  { nome: 'bolletta-computer', vista: 'bolletta', w: 1280, h: 800 },
  { nome: 'telefono', vista: 'bolletta', w: 390, h: 844 },
];
for (const v of viste) {
  const p = await browser.newPage();
  await p.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 2, isMobile: v.w < 600, hasTouch: v.w < 600 });
  await p.goto(`http://127.0.0.1:3292/auth/foto-landing?vista=${v.vista}`, { waitUntil: 'networkidle0', timeout: 180000 });
  await p.waitForSelector('[data-pronto="si"]', { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  await p.screenshot({ path: path.join(out, `${v.nome}.png`) });
  const testo = await p.evaluate(() => document.body.innerText.slice(0, 1500));
  fs.writeFileSync(path.join(out, `${v.nome}.txt`), testo);
  await p.close();
}
await browser.close();
console.log('fatto');
