/* Dimora, la landing (25/10/2026). Uno script solo, nessuna dipendenza. L'unica chiamata a terzi è il tag di Google, dopo «Accetta».
   Ogni parte si accende da sé: se una fallisce, le altre restano, e senza script la pagina si legge tutta.
   Le animazioni partono solo se la testa della pagina ha messo «vivo» sull'<html> (cioè senza «meno animazioni»). */

/* Il consenso (2/11/2026), con le regole dell'app (lib/consenso.ts). La testa della pagina ha già messo il consenso di
   partenza, tutto negato, e iubenda: iubenda scrive la scelta nel dataLayer, e qui la si guarda passare. Il tag di Google
   si carica solo con la pubblicità concessa e solo su dimorapp.com; le Preview non lo caricano mai. Serve a salvare il clic
   sull'annuncio in un cookie che legge anche l'app: nessuna pagina vista e nessuna conversione partono da qui.
   Con ?prova_consenso=1 la pagina scrive in console che cosa avrebbe fatto, e non lo fa. */
(function () {
  'use strict';

  var ID_GOOGLE = 'AW-18536196284';
  var SCRIPT_GOOGLE = 'https://www.googletagmanager.com/gtag/js?id=' + ID_GOOGLE;
  var prova = new URLSearchParams(location.search).has('prova_consenso');
  var produzione = location.hostname === 'dimorapp.com' || location.hostname === 'www.dimorapp.com';
  var scelta = null, tagCaricato = false;

  function dice() {
    if (prova && window.console) console.info.apply(console, ['[prova consenso]'].concat([].slice.call(arguments)));
  }
  function richiesteGoogle() {
    return performance.getEntriesByType('resource').filter(function (r) { return /google|doubleclick/i.test(new URL(r.name).hostname); }).length;
  }
  function caricaTag() {
    if (tagCaricato) return;
    tagCaricato = true;
    if (prova) { dice('Avrei caricato', SCRIPT_GOOGLE, 'e mandato:', ['config', ID_GOOGLE, { send_page_view: false }], 'Nessuna conversione sulla landing.'); return; }
    if (!produzione) return;
    window.gtag('js', new Date());
    window.gtag('config', ID_GOOGLE, { send_page_view: false });
    var s = document.createElement('script');
    s.src = SCRIPT_GOOGLE;
    s.async = true;
    document.head.appendChild(s);
  }
  // Un aggiornamento del consenso, come lo scrive iubenda: gtag('consent', 'update', {...}), cioè una lista di argomenti.
  function guarda(voce) {
    if (!voce || voce[0] !== 'consent' || voce[1] !== 'update' || !voce[2] || !('ad_storage' in voce[2])) return;
    var ora = voce[2].ad_storage === 'granted' ? 'concesso' : 'negato';
    if (ora === scelta) return;
    scelta = ora;
    dice('Scelta ricevuta da iubenda: consenso pubblicitario ' + ora + '. Richieste a Google finora: ' + richiesteGoogle() + '.');
    if (ora === 'concesso') caricaTag();
  }

  var dl = window.dataLayer;
  if (dl && window.gtag) {
    dice('Il consenso parte negato. Il tag di Google parte solo dopo «Accetta», e in questa prova non parte. Richieste a Google finora: ' + richiesteGoogle() + '.');
    // iubenda può aver già riletto una scelta fatta prima di questa pagina: lo script arriva dopo di lui.
    var viste = dl.slice();
    var push = dl.push;
    dl.push = function () {
      var r = push.apply(dl, arguments);
      [].forEach.call(arguments, guarda);
      return r;
    };
    viste.forEach(guarda);
  }

  // «Preferenze cookie» riapre il pannello. Senza script il collegamento porta alla cookie policy, che ha lo stesso comando.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-preferenze-cookie]');
    if (!a) return;
    e.preventDefault();
    var atteso = 0;
    (function apri() {
      var api = window._iub && window._iub.cs && window._iub.cs.api;
      if (api && typeof api.openPreferences === 'function') { api.openPreferences(); return; }
      if (atteso >= 8000) {
        if (a.nextElementSibling && a.nextElementSibling.hasAttribute('data-preferenze-esito')) return;
        a.insertAdjacentHTML('afterend', '<span role="status" data-preferenze-esito>Le preferenze non si aprono adesso. Riprova fra poco.</span>');
        return;
      }
      atteso += 200;
      setTimeout(apri, 200);
    })();
  });
})();

(function () {
  'use strict';

  var radice = document.documentElement;
  var vivo = radice.classList.contains('vivo');
  var risparmio = false; // risparmio dati: i video partono solo col pulsante «▶»
  var fermi = false;     // «meno animazioni» acceso a pagina aperta: nessun video
  try { risparmio = !!(navigator.connection && navigator.connection.saveData); } catch (e) { /* niente */ }

  function parte(nome, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn('[landing] ' + nome, e); }
  }
  function limita(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  var IO = 'IntersectionObserver' in window;
  // Da 768 px in su: la scena del fascicolo segue lo scorrimento e la finestra dei racconti resta ferma. Sotto, niente
  // si ferma sullo schermo (ottavo giro, 11/11).
  var largo = window.matchMedia('(min-width: 48rem)');
  // Quello che serve più in basso si prepara quando il browser è libero: la prima schermata si disegna prima.
  // Settimo giro (28/10): la coda non parte all'apertura della pagina. Parte al primo gesto (scorrimento, tocco, tasto,
  // clic) e le scene solo quando la loro sezione si avvicina allo schermo (vicino): prima di allora lo script non fa
  // altro che l'apertura. Un salto a un'ancora prepara tutto subito, perché il salto trovi le altezze vere.
  var inAttesa = [], vicine = [], coda = { partita: false, gira: false, finita: false, subito: false };
  var quando = window.requestIdleCallback || function (f) { return setTimeout(f, 120); };
  function dopo(nome, fn) { inAttesa.push([nome, fn]); if (coda.partita && !coda.subito) prossima(); }
  // Una parte per volta, ognuna nel suo momento libero: nessun compito lungo che blocchi la pagina.
  function prossima() {
    if (coda.gira) return;
    var x = inAttesa.shift();
    if (!x) {
      aggiornaVideo(); chiedi();
      if (!coda.finita) { coda.finita = true; if (metaIniziale && !scorsoDaSe) metaIniziale.scrollIntoView(); }
      return;
    }
    coda.gira = true;
    quando(function () { coda.gira = false; parte(x[0], x[1]); chiedi(); prossima(); }, { timeout: 1500 });
  }
  function avviaCoda() { if (!coda.partita) { coda.partita = true; prossima(); } }
  // Una scena: si prepara quando la sua sezione arriva a mezzo schermo dal fondo dello schermo, subito (non aspetta un
  // momento libero: durante uno scorrimento veloce potrebbe arrivare tardi).
  function vicino(sel, nome, fn) {
    var el = document.querySelector(sel);
    var v = { nome: nome, fn: fn, fatto: false };
    var via = function () { if (v.fatto) return; v.fatto = true; avviaCoda(); parte(nome, fn); chiedi(); };
    if (!el) return;
    if (!('IntersectionObserver' in window)) { dopo(nome, fn); return; }
    vicine.push(v);
    var o = new IntersectionObserver(function (voci) {
      if (voci.some(function (x) { return x.isIntersecting; })) { o.disconnect(); via(); }
    }, { rootMargin: '0px 0px 50% 0px' });
    o.observe(el);
  }
  // Tutto adesso: la coda e le scene che aspettano.
  function subito() {
    coda.partita = true; coda.subito = true;
    vicine.forEach(function (v) { if (!v.fatto) { v.fatto = true; inAttesa.push([v.nome, v.fn]); } });
    while (inAttesa.length) { var x = inAttesa.shift(); parte(x[0], x[1]); }
    coda.subito = false;
    aggiornaVideo(); chiedi();
  }

  /* ---------- Le statistiche (Vercel Web Analytics, come dall'8/10) ----------
     Lo script /_vercel/insights/script.js è servito dal sito stesso e legge la coda window.vaq della testa.
     1. Prima dell'invio ogni indirizzo si ripulisce (beforeSend): via il frammento e tutti i parametri, tranne i cinque
        delle campagne; anche questi si scartano se contengono una chiocciola o superano i 100 caratteri.
     2. Gli eventi: nomi stabili, una sola proprietà, «posizione», dagli attributi data-evento e data-posizione.
     Mai dati della persona. Se lo script è bloccato non succede niente. */
  var CAMPAGNA = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  function indirizzoPulito(indirizzo) {
    var u = new URL(indirizzo);
    var tenuti = new URLSearchParams();
    CAMPAGNA.forEach(function (chiave) {
      var valore = u.searchParams.get(chiave);
      if (valore !== null && valore.indexOf('@') === -1 && valore.length <= 100) tenuti.append(chiave, valore);
    });
    var ricerca = tenuti.toString();
    return u.origin + u.pathname + (ricerca ? '?' + ricerca : '');
  }
  function statistica() {
    try { if (typeof window.va === 'function') window.va.apply(window, arguments); } catch (e) { /* mai */ }
  }
  statistica('beforeSend', function (e) {
    try {
      var copia = {};
      for (var k in e) if (Object.prototype.hasOwnProperty.call(e, k)) copia[k] = e[k];
      copia.url = indirizzoPulito(e.url);
      return copia;
    } catch (x) { return null; }
  });
  document.addEventListener('click', function (e) {
    try {
      var el = e.target && e.target.closest ? e.target.closest('[data-evento]') : null;
      if (el) statistica('event', { name: el.getAttribute('data-evento'), data: { posizione: el.getAttribute('data-posizione') || '' } });
    } catch (x) { /* niente */ }
  });

  /* ---------- I salti alle sezioni ----------
     Le sezioni più in basso il browser le impagina solo quando ci si avvicina (content-visibility, nel foglio di stile):
     per un salto servono le altezze vere, quindi prima del salto si impagina tutto. */
  // La sezione dell'indirizzo (/#novita): ci si torna anche quando lo script ha finito di preparare i racconti, che
  // cambiano le altezze sopra di lei, a meno che la persona abbia già scorso da sé.
  var metaIniziale = null, scorsoDaSe = false;
  parte('salti', function () {
    function pieno() { radice.classList.add('cv-pieno'); }
    if (location.hash) {
      pieno();
      metaIniziale = document.getElementById(location.hash.slice(1));
      if (metaIniziale) requestAnimationFrame(function () { metaIniziale.scrollIntoView(); });
      ['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, function () { scorsoDaSe = true; }, { once: true, passive: true }); });
    }
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href*="#"]') : null;
      if (a && a.pathname === location.pathname && a.hash) { pieno(); subito(); }
    }, true);
  });

  /* ---------- Il menu del telefono: si chiude scegliendo una voce, toccando fuori o con Esc ---------- */
  parte('menu', function () {
    var menu = document.querySelector('[data-menu]');
    if (!menu) return;
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.open = false; });
    document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
    });
  });

  /* ---------- I prezzi: l'interruttore annuale / mensile ---------- */
  parte('prezzi', function () {
    var sezione = document.querySelector('[data-prezzi]');
    if (!sezione) return;
    var voci = sezione.querySelectorAll('[data-periodo-scelta]');
    function scegli(p) {
      sezione.setAttribute('data-periodo', p);
      voci.forEach(function (v) { v.setAttribute('aria-pressed', String(v.getAttribute('data-periodo-scelta') === p)); });
    }
    voci.forEach(function (v) { v.addEventListener('click', function () { scegli(v.getAttribute('data-periodo-scelta')); }); });
    scegli('anno');
  });

  /* ---------- Le entrate: un blocco entra intero quando arriva sullo schermo, una volta sola (ottavo giro, 11/11) ----------
     Niente segue più lo scorrimento (resta solo la scena del fascicolo): i titoli e i blocchi qui sotto aspettano sotto
     lo schermo ed entrano con una dissolvenza breve. Quello che è già sullo schermo, o sopra, non si tocca: in nessun
     momento un testo che si sta leggendo sbiadisce. Dove sta ogni blocco lo dice il browser (un osservatore, una volta):
     nessuna misura letta dallo script, che costringerebbe a impaginare le sezioni ancora lontane. Finita l'entrata i
     segni si tolgono. I blocchi dello stesso gruppo entrano uno dopo l'altro (--k). */
  var ENTRA = '[data-entra], .sezione-sotto, .passi > .passo, .lettera-foto, .lettera-testo, .prova, .piano, .sicura, .riquadro-telefono, .finale-riquadro, .commercialista, .voce-chi, .cassetto-quadro, .racconto .finestra';
  var entrate = null, classifica = null;
  function entra(el, k) {
    if (!classifica || el.hasAttribute('data-attesa')) return;
    if (k) el.style.setProperty('--k', String(k));
    classifica.observe(el);
  }
  dopo('entrate', function () {
    if (!vivo || !IO) return;
    entrate = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        var el = v.target;
        entrate.unobserve(el);
        el.setAttribute('data-visto', '');
        setTimeout(function () { el.removeAttribute('data-attesa'); el.removeAttribute('data-visto'); el.style.removeProperty('--k'); }, 1100);
      });
    });
    classifica = new IntersectionObserver(function (voci) {
      var vh = window.innerHeight;
      voci.forEach(function (v) {
        classifica.unobserve(v.target);
        var r = v.boundingClientRect;
        // Sullo schermo, o sopra: resta com'è. Sotto (o in una sezione che il browser non ha ancora impaginato): aspetta.
        if (v.isIntersecting || (r.height > 0 && r.top < vh)) return;
        v.target.setAttribute('data-attesa', '');
        entrate.observe(v.target);
      });
    });
    var turni = typeof Map === 'function' ? new Map() : null;
    document.querySelectorAll(ENTRA).forEach(function (el) {
      var k = 0;
      if (turni) { k = turni.get(el.parentNode) || 0; turni.set(el.parentNode, k + 1); }
      entra(el, Math.min(k, 4));
    });
  });

  /* ---------- I disegni delle sezioni: si tracciano una volta sola, quando entrano (ottavo giro, 11/11) ----------
     Lo script li prepara (data-traccia: il tratto è nascosto) e, quando un terzo del disegno è sullo schermo, li fa
     partire (data-visto): ogni tratto al suo turno (--i nello stile), il tocco ambra per ultimo, in meno di un secondo.
     Poi restano disegnati. Senza script, o prima che li prenda, sono già tutti disegnati. */
  dopo('disegni', function () {
    if (!vivo || !IO) return;
    var o = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) { o.unobserve(v.target); v.target.setAttribute('data-visto', ''); } });
    }, { threshold: 0.3 });
    document.querySelectorAll('[data-disegno]').forEach(function (d) { d.setAttribute('data-traccia', ''); o.observe(d); });
  });

  /* ---------- La fila dei nomi dei documenti: scorre piano e senza stacco (ottavo giro, 11/11) ----------
     Il numero è fermo a 120. Sotto, i nomi veri: lo script raddoppia l'elenco (la copia è nascosta ai lettori di schermo)
     e l'animazione, nel foglio di stile, lo sposta di metà: quando la copia arriva al posto dell'originale si ricomincia,
     e non si vede. La velocità è la stessa a ogni larghezza (36 px al secondo). Si ferma al passaggio del mouse e col
     fuoco dentro (foglio di stile), e fuori dallo schermo. */
  var VELOCITA_FILA = 36;
  dopo('tipi', function () {
    var box = document.querySelector('[data-tipi]');
    var fila = box && box.querySelector('.tipi-fila');
    if (!vivo || !fila || !IO) return;
    Array.prototype.slice.call(fila.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      fila.appendChild(c);
    });
    box.style.setProperty('--durata', Math.max(30, Math.round(fila.scrollWidth / 2 / VELOCITA_FILA)) + 's');
    box.setAttribute('data-pausa', '');
    box.setAttribute('data-gira', '');
    new IntersectionObserver(function (voci) { box.toggleAttribute('data-pausa', !voci[0].isIntersecting || fermi); }).observe(box);
  });

  /* ---------- Un video alla volta ----------
     Ogni video della pagina (le finestre dei racconti, le carte delle novità, l'articolo) si iscrive qui con un peso:
     quanto «vuole» girare adesso. Gira solo quello col peso più alto, gli altri si fermano. L'indirizzo del video si
     scrive la prima volta che tocca a lui: nessun video si scarica prima. Ogni video è muto, in linea e in autoplay;
     il video resta trasparente finché non gira davvero, quindi sotto si vede sempre la sua immagine. Se il telefono
     non lo fa partire (risparmio energetico dell'iPhone, risparmio dati di Android) resta l'immagine con un piccolo
     pulsante «▶»: toccandolo il video parte. Mai un riquadro vuoto o nero. */
  var candidati = [];
  function iscrivi(c) {
    c.video.addEventListener('playing', function () {
      if (c.video.paused) return;
      c.video.setAttribute('data-gira', '');
      if (c.pulsante) c.pulsante.hidden = true;
    });
    candidati.push(c);
  }
  function avvia(c) {
    if (!c.video.getAttribute('src')) c.video.setAttribute('src', c.mp4);
    var p = c.video.play();
    if (p && p.catch) p.catch(function () { pulsante(c); });
  }
  // Il pulsante «▶» sull'immagine, solo quando la partenza è stata negata.
  function pulsante(c) {
    if (c.pulsante) { c.pulsante.hidden = false; return; }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'video-avvia';
    b.setAttribute('aria-hidden', 'true');
    b.tabIndex = -1;
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); c.voluto = true; avvia(c); });
    c.pulsante = b;
    c.video.parentNode.appendChild(b);
  }
  function aggiornaVideo() {
    var scelto = null, massimo = 0;
    candidati.forEach(function (c) { var p = c.peso(); if (p > massimo) { massimo = p; scelto = c; } });
    candidati.forEach(function (c) {
      if (c === scelto && !fermi) {
        if (c.video.paused) { if (risparmio && !c.voluto) pulsante(c); else avvia(c); }
      } else if (!c.video.paused) {
        c.video.pause();
      }
    });
  }
  function nuovoVideo() {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('autoplay', ''); v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('aria-hidden', 'true');
    v.width = 960; v.height = 600;
    return v;
  }

  /* ---------- I racconti: la finestra ferma (da 768 px) o le immagini delle storie (sotto) ----------
     Due racconti (Se affitti, Per ogni immobile). Da 768 px in su ognuno ha la sua finestra, che resta ferma accanto
     alle storie: la finestra si costruisce dalle storie (data-storia), per ognuna un'immagine ferma e, se ce l'ha, il
     suo video; la schermata cambia a scatto con la storia che passa a metà schermo. Sotto i 768 px (ottavo giro, 11/11)
     niente si ferma: ogni storia tiene la sua immagine e il suo video ci gira sopra quando è sullo schermo. Si prepara
     solo il modo che serve, e l'altro se la finestra del browser cambia misura. */
  var racconti = [];
  dopo('racconti', function () {
    if (!vivo) return;
    // Un racconto per volta, ognuno nel suo momento libero (sesto giro): prepararli insieme era il compito più lungo
    // dell'apertura della pagina.
    document.querySelectorAll('[data-racconto]').forEach(function (sezione) {
      dopo('racconto', function () {
        var storie = Array.prototype.slice.call(sezione.querySelectorAll('[data-storia]'));
        var schermo = sezione.querySelector('[data-schermo]');
        var avanzamento = sezione.querySelector('[data-avanzamento]');
        var finestra = sezione.querySelector('[data-finestra]');
        var griglia = sezione.querySelector('.racconto-griglia');
        var contenitore = sezione.querySelector('.racconto-schermo');
        if (!storie.length || !schermo) return;
        // Di ogni storia: l'immagine ferma e, se c'è, il video (una storia delle novità, o un passo col suo minivideo).
        var dati = storie.map(function (s) {
          var id = s.getAttribute('data-storia');
          var immagine = s.getAttribute('data-immagine');
          var videoPasso = s.getAttribute('data-video');
          return { storia: s, immagine: immagine || '/assets/novita/' + id + '.webp', grande: !!immagine && !videoPasso, mp4: !immagine || videoPasso ? (videoPasso || '/assets/novita/' + id + '.mp4') : null };
        });
        var fatta = false, fatte = false;

        function finestraFerma() {
          var attiva = -1, inVista = false;
          var slide = dati.map(function (x, i) {
            var d = document.createElement('div');
            d.className = 'slide';
            var img = document.createElement('img');
            img.src = x.immagine; img.alt = '';
            img.width = x.grande ? 1280 : 960; img.height = x.grande ? 800 : 600;
            img.decoding = 'async'; img.loading = i < 1 ? 'eager' : 'lazy';
            d.appendChild(img);
            if (x.mp4) {
              var v = nuovoVideo();
              v.className = 'schermo-video';
              d.appendChild(v);
              iscrivi({ video: v, mp4: x.mp4, peso: function () { return i === attiva && inVista && largo.matches ? 2 : 0; } });
            }
            schermo.appendChild(d);
            var seg = document.createElement('span');
            if (avanzamento) avanzamento.appendChild(seg);
            return { el: d, seg: seg, storia: x.storia };
          });
          sezione.setAttribute('data-pronto', '');
          entra(finestra);

          function scegli(i) {
            if (i === attiva) return;
            attiva = i;
            slide.forEach(function (s, k) {
              var on = k === i;
              s.el.toggleAttribute('data-attiva', on);
              s.seg.toggleAttribute('data-attiva', on);
              s.storia.toggleAttribute('data-attiva', on);
            });
            aggiornaVideo();
          }
          if (IO) {
            new IntersectionObserver(function (voci) { inVista = voci[0].isIntersecting; aggiornaVideo(); }).observe(griglia);
          } else { inVista = true; }
          scegli(0);

          racconti.push(function (vh) {
            if (!largo.matches) return;
            var g = griglia.getBoundingClientRect();
            if (g.bottom < -vh || g.top > vh * 2) return;
            // La linea di riferimento: al computer il centro dello schermo; al tablet il centro di quello che resta
            // sotto la finestra ferma.
            var linea = vh / 2;
            var c = contenitore.getBoundingClientRect();
            if (window.getComputedStyle(contenitore).order === '-1') linea = c.bottom + (vh - c.bottom) / 2;
            var migliore = 0, distanza = Infinity;
            storie.forEach(function (s, i) {
              var r = s.getBoundingClientRect();
              var d = r.top <= linea && r.bottom >= linea ? 0 : Math.min(Math.abs(r.top - linea), Math.abs(r.bottom - linea));
              if (d < distanza) { distanza = d; migliore = i; }
            });
            return function () { scegli(migliore); };
          });
        }

        // Sotto i 768 px: il video di ogni storia sopra la sua immagine, e gira quello più sullo schermo.
        function immaginiVive() {
          if (!IO) return;
          var quota = typeof Map === 'function' ? new Map() : null;
          if (!quota) return;
          var osserva = new IntersectionObserver(function (voci) {
            voci.forEach(function (v) { quota.set(v.target, v.intersectionRatio); });
            aggiornaVideo();
          }, { threshold: [0, 0.3, 0.6, 0.8, 1] });
          dati.forEach(function (x) {
            var fig = x.storia.querySelector('.storia-locandina');
            if (!x.mp4 || !fig) return;
            var v = nuovoVideo();
            fig.appendChild(v);
            iscrivi({ video: v, mp4: x.mp4, peso: function () { var q = quota.get(fig) || 0; return !largo.matches && q >= 0.6 ? q : 0; } });
            osserva.observe(fig);
          });
        }

        function prepara() {
          if (largo.matches) { if (!fatta) { fatta = true; finestraFerma(); } }
          else if (!fatte) { fatte = true; immaginiVive(); }
          aggiornaVideo(); chiedi();
        }
        prepara();
        if (largo.addEventListener) largo.addEventListener('change', function () { parte('racconto', prepara); });
      });
    });
  });

  /* ---------- Le carte delle novità: il video piccolo parte quando la carta è sullo schermo ---------- */
  dopo('carte', function () {
    if (!vivo || !('IntersectionObserver' in window)) return;
    var quota = new Map();
    var osserva = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { quota.set(v.target, v.intersectionRatio); });
      aggiornaVideo();
    }, { threshold: [0, 0.3, 0.6, 0.8, 1] });
    document.querySelectorAll('[data-video-carta]').forEach(function (m) {
      var v = nuovoVideo();
      m.appendChild(v);
      quota.set(m, 0);
      iscrivi({ video: v, mp4: m.getAttribute('data-video-carta'), peso: function () { var q = quota.get(m) || 0; return q >= 0.6 ? q : 0; } });
      osserva.observe(m);
    });
  });

  /* ---------- Scena A, «dal cassetto al fascicolo»: la sezione ferma e lo scorrimento che manda avanti la scena ----------
     p va da 0 (la sezione arriva sotto la testata) a 1 (fine della corsa). I tempi, in p:
       0-0,10    le carte sparse, coi posti dove stanno oggi («nella mail», «nel cassetto», «nei download»);
       0,05-0,12 compaiono le tre cartelle;
       0,10-0,45 le carte volano nelle cartelle, una dopo l'altra; il contatore di ogni cartella sale di uno a ogni carta
                 che entra (settimo giro, 28/10), e risalendo scende;
       0,42-0,54 la cartella di via Mazzini si apre fino a riempire il palco, le altre se ne vanno;
       0,52-0,66 i gruppi di documenti, uno dopo l'altro;
       0,66-0,92 escono i tre cartellini, ognuno dalla sua riga (il canone dal contratto, la rendita e la scadenza
                 dalla visura: la scadenza è l'IMU), e si posano a fianco della cartella, legati da una linea sottile;
                 l'ultimo (la scadenza, col punto ambra) per ultimo.
     Le carte: la bolletta e la foto nella casa al mare, il rogito nel box, il resto in via Mazzini (sesto giro, 27/10).
     I testi (ottavo giro, 11/11): sempre a opacità piena, uno alla volta; il primo fino a 0,12, il secondo fino a 0,58,
     poi il terzo, e cambiano con uno stacco. Si muovono solo carte, cartelle e cartellini. Si scrivono solo
     trasformazioni e opacità: l'impaginazione non si muove. Risalendo, gli stessi conti all'indietro. p segue lo
     scorrimento con un piccolo ritardo morbido (vedi il giro per fotogramma, in fondo). La corsa è corta: la sezione è
     alta una schermata e mezza, e la scena comincia un quarto di schermo prima di fermarsi.
     Sotto i 768 px la scena non segue lo scorrimento: i tre quadri fermi qui sotto, che entrano uno alla volta.
     Con «meno animazioni» (settimo giro, 28/10) niente si ferma e niente si muove, ma il racconto resta: tre quadri
     fermi, uno sotto l'altro, ognuno col suo testo accanto (al computer) o sopra (al telefono). Li disegna la stessa
     funzione, a tre punti fermi della corsa. */
  function quanti(n) { return n === 1 ? '1 documento' : n + ' documenti'; }
  // Il palco della scena: le sue misure e la funzione che lo disegna a un punto p della corsa.
  function palcoCassetto(palco) {
    var tutti = function (sel) { return Array.prototype.slice.call(palco.querySelectorAll(sel)); };
    var cartelle = tutti('[data-cartella]').map(function (el) {
      var conta = el.querySelector('[data-documenti]');
      return { el: el, conta: conta, scritto: null, quante: 0 };
    });
    var carte = tutti('[data-carta]').map(function (el) {
      var da = el.getAttribute('data-da').split(',').map(Number);
      var dove = el.getAttribute('data-in'), f = 0;
      cartelle.forEach(function (c, i) { if (c.el.getAttribute('data-cartella') === dove) f = i; });
      return { el: el, x: da[0], y: da[1], r: da[2], f: f, j: cartelle[f].quante++ };
    });
    var mazzini = palco.querySelector('[data-cartella="mazzini"]');
    var aperto = palco.querySelector('[data-aperto]');
    var testa = aperto.querySelector('.fa-testa');
    var righe = Array.prototype.slice.call(aperto.querySelectorAll('[data-riga]'));
    // Ogni cartellino ha la sua riga (data-a): esce da lì e una linea sottile ce lo lega.
    var cartellini = tutti('[data-cartellino]').map(function (el) {
      return { el: el, riga: aperto.querySelector('[data-lega="' + el.getAttribute('data-a') + '"]') };
    });
    var linee = tutti('[data-linea]');
    var tela = palco.querySelector('[data-linee]');
    // Le curve (sesto giro, 27/10): le carte partono piano e arrivano rallentando, i cartellini si posano rallentando.
    var morbido = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var rallenta = function (t) { return 1 - Math.pow(1 - t, 3); };
    var parte_ = function (t) { return t * t * (3 - 2 * t); };
    var tra = function (p, a, b) { return limita((p - a) / (b - a)); };
    var firmaMisure = '', misurePrima = null, primaD = '';
    // Legge le misure e restituisce che cosa scrivere al punto p: { fn } oppure, quando prima vanno sistemate le
    // posizioni di riposo, { fn, riposo: true } (e poi si rimisura). Con «dentro» le carte restano nelle loro cartelle,
    // ferme e visibili: il secondo quadro di «meno animazioni».
    return function (p, dentro) {
      var L = palco.clientWidth, A = palco.clientHeight;
      // Letture prima delle scritture: le misure di riposo (offset) non dipendono dalle trasformazioni. Si rifanno solo
      // quando cambia qualcosa che le muove (il palco, la cartella aperta, i cartellini): a ogni fotogramma si usa quelle.
      var firma = L + 'x' + A + ':' + aperto.offsetTop + ':' + aperto.offsetHeight + ':' + cartellini.map(function (t) { return t.el.offsetTop + '/' + t.el.offsetWidth; }).join(',');
      var misure = firma === firmaMisure ? misurePrima : null;
      if (!misure) {
        var cw = carte[0].el.offsetWidth, ch = carte[0].el.offsetHeight;
        var P = { x: aperto.offsetLeft, y: aperto.offsetTop, w: aperto.offsetWidth, h: aperto.offsetHeight };
        var telefono = L < 660; // il palco stretto: i cartellini sotto (lo stesso confine del foglio di stile)
        var scatola = function (el) { return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; };
        misure = {
          telefono: telefono, cw: cw, ch: ch,
          cart: cartelle.map(function (c) { return scatola(c.el); }),
          dove: carte.map(function (c) { var d = cartelle[c.f].el; return { x: d.offsetLeft + d.offsetWidth / 2 - cw / 2, y: d.offsetTop + d.offsetHeight * 0.45 - ch / 2 }; }),
          R: scatola(mazzini),
          P: P,
          // Dove sta la riga di ogni cartellino a cartella aperta, e dove si posa il cartellino.
          lega: cartellini.map(function (t) {
            // La riga dentro la cartella aperta: le misure si sommano fino a lei (i gruppi, che si muovono, fanno da
            // riferimento alle loro righe).
            var g = t.riga, gx = 0, gy = 0;
            for (var e = g; e && e !== aperto; e = e.offsetParent) { gx += e.offsetLeft; gy += e.offsetTop; }
            return { riga: { x: P.x + gx, y: P.y + gy, w: g.offsetWidth, h: g.offsetHeight }, t: scatola(t.el) };
          }),
        };
        firmaMisure = firma; misurePrima = misure;
        misure.d = misure.lega.map(function (m, j) {
          var a = m.riga, b = m.t, ax, ay = a.y + a.h / 2, bx, by = b.y + b.h / 2;
          if (!telefono) {
            // Al computer: dal bordo destro della riga al bordo sinistro del cartellino, con una curva dolce.
            ax = a.x + a.w + 6; bx = b.x - 6;
            var mx = (ax + bx) / 2;
            return 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' C' + mx.toFixed(1) + ' ' + ay.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + by.toFixed(1) + ' ' + bx.toFixed(1) + ' ' + by.toFixed(1);
          }
          // Al telefono: dal bordo destro della riga, giù nel margine a destra, fino al bordo destro del cartellino.
          ax = a.x + a.w + 3; bx = b.x + b.w + 4;
          var gx = Math.max(ax, bx) + 6 + j * 5;
          return 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' H' + gx.toFixed(1) + ' V' + by.toFixed(1) + ' H' + bx.toFixed(1);
        });
      }
      // Al computer la cartella aperta sta a metà del palco e ogni cartellino all'altezza della sua riga (la rendita e la
      // scadenza a cavallo della visura). Sono posizioni di riposo: si scrivono solo quando cambiano (una nuova misura
      // del palco), poi il giro seguente rimisura tutto.
      var riposo = null, telefono = misure.telefono, P = misure.P;
      if (!telefono) {
        var su = Math.round(Math.max(A * 0.03, (A - P.h) / 2));
        var centro = function (j) { var l = misure.lega[j]; return su + (l.riga.y - P.y) + l.riga.h / 2; };
        var tops = cartellini.map(function (t, j) {
          var th = misure.lega[j].t.h, c = centro(j);
          if (j === 1) c -= th * 0.68; else if (j === 2) c += th * 0.68;
          return Math.round(c - th / 2);
        });
        if (Math.abs(su - P.y) > 1 || tops.some(function (y, j) { return Math.abs(y - misure.lega[j].t.y) > 1; })) riposo = { su: su, tops: tops };
      } else if (aperto.style.top) riposo = { su: '', tops: cartellini.map(function () { return ''; }) };
      if (riposo) {
        return { riposo: true, fn: function () {
          aperto.style.top = riposo.su === '' ? '' : riposo.su + 'px';
          cartellini.forEach(function (t, j) { t.el.style.top = riposo.tops[j] === '' ? '' : riposo.tops[j] + 'px'; });
        } };
      }
      var m = misure, tutteD = m.d.join('|') + '|' + L + 'x' + A, cambiaD = tutteD !== primaD;
      primaD = tutteD;
      return { fn: function () {
      if (cambiaD && tela) {
        tela.setAttribute('viewBox', '0 0 ' + L + ' ' + A);
        linee.forEach(function (l, j) { if (m.d[j]) l.setAttribute('d', m.d[j]); });
      }
      // Le carte: volano nella loro cartella con una leggera rotazione, che si raddrizza quando entrano. Ogni cartella
      // si gonfia un attimo quando una carta ci entra, e conta le carte entrate.
      var gonfia = cartelle.map(function () { return 0; }), entrate = cartelle.map(function () { return 0; });
      carte.forEach(function (c, i) {
        if (dentro) {
          // Ferme nella cartella, a ventaglio, e spuntano da sopra il bordo: larghe poco più di un terzo della cartella.
          var f = m.cart[c.f], n = cartelle[c.f].quante, s = f.w * 0.38 / m.cw, sp = c.j - (n - 1) / 2;
          var fx = f.x + f.w / 2 - m.cw / 2 + sp * m.cw * s * 0.62;
          var fy = f.y - m.ch * s * 0.6 - m.ch / 2 + m.ch * s / 2;
          c.el.style.transform = 'translate(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px) rotate(' + (sp * 6).toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
          c.el.style.opacity = '1';
          entrate[c.f]++;
          return;
        }
        var a = 0.10 + i * 0.035, b = 0.27 + i * 0.035;
        var t = tra(p, a, b), k = rallenta(parte_(t));
        var x = c.x * L + (m.dove[i].x - c.x * L) * k;
        var y = c.y * A + (m.dove[i].y - c.y * A) * k;
        var sc = 1 - 0.78 * k;
        var giro = c.r * (1 - k) + (c.r >= 0 ? -1 : 1) * 7 * Math.sin(Math.PI * k);
        c.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + giro.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        c.el.style.opacity = String(limita((1 - k) * 6));
        gonfia[c.f] = Math.max(gonfia[c.f], Math.sin(Math.PI * tra(p, b - 0.02, b + 0.035)));
        // Entrata quando scompare dentro la cartella (l'opacità arriva a zero a k = 5/6).
        if (k >= 0.83) entrate[c.f]++;
      });
      // Le cartelle: compaiono, poi lasciano il posto alla cartella aperta.
      var compare = dentro ? 1 : morbido(tra(p, 0.05, 0.12));
      var apre = dentro ? 0 : morbido(tra(p, 0.42, 0.54));
      cartelle.forEach(function (c, i) {
        var el = c.el;
        var via = el === mazzini ? limita(apre * 4) : apre;
        var g = 1 + 0.07 * gonfia[i];
        el.style.opacity = String(compare * (1 - via));
        el.style.transform = 'translateY(' + ((1 - compare) * 24 + (el === mazzini ? 0 : via * 18)).toFixed(1) + 'px) scale(' + g.toFixed(3) + ')';
        if (c.conta) {
          var testo = quanti(entrate[i]);
          if (testo !== c.scritto) { c.conta.textContent = testo; c.scritto = testo; }
          c.conta.style.opacity = entrate[i] > 0 ? '1' : '0';
        }
      });
      // La cartella di via Mazzini che si apre.
      var R = m.R, P = m.P;
      aperto.style.opacity = String(limita(apre * 8));
      aperto.style.transform = 'translate(' + ((R.x - P.x) * (1 - apre)).toFixed(1) + 'px,' + ((R.y - P.y) * (1 - apre)).toFixed(1) + 'px) scale(' +
        (R.w / P.w + (1 - R.w / P.w) * apre).toFixed(4) + ',' + (R.h / P.h + (1 - R.h / P.h) * apre).toFixed(4) + ')';
      testa.style.opacity = String(tra(p, 0.50, 0.55));
      righe.forEach(function (riga, j) {
        var o = rallenta(tra(p, 0.52 + j * 0.03, 0.58 + j * 0.03));
        riga.style.opacity = String(o);
        riga.style.transform = 'translateY(' + ((1 - o) * 10).toFixed(1) + 'px)';
      });
      // I cartellini escono dalla loro riga e si posano rallentando a fianco (al computer) o sotto (al telefono); la
      // linea compare con loro.
      cartellini.forEach(function (t, j) {
        var k = dentro ? 0 : rallenta(tra(p, 0.66 + j * 0.08, 0.78 + j * 0.08));
        var l = m.lega[j], dx = l.riga.x + l.riga.w * 0.5 - (l.t.x + l.t.w / 2), dy = l.riga.y + l.riga.h / 2 - (l.t.y + l.t.h / 2);
        t.el.style.opacity = String(limita(k * 3));
        t.el.style.transform = 'translate(' + (dx * (1 - k)).toFixed(1) + 'px,' + (dy * (1 - k)).toFixed(1) + 'px) scale(' + (0.5 + 0.5 * k).toFixed(3) + ')';
        if (linee[j]) linee[j].style.opacity = String(limita((k - 0.55) / 0.45));
      });
      } };
    };
  }

  // «Meno animazioni»: i tre quadri fermi. Il primo e il secondo sono copie del palco (nascoste ai lettori di schermo
  // come il palco); il terzo è il palco della pagina. Ogni testo va nel suo quadro.
  function quadriFermi(sezione, palco) {
    var griglia = palco.parentNode;
    var testi = Array.prototype.slice.call(sezione.querySelectorAll('.cassetto-testo'));
    if (testi.length !== 3 || !griglia) return;
    var quadri = [0, 0.45, 1].map(function (p, i) {
      var q = griglia, pl = palco;
      if (i < 2) {
        q = document.createElement('div');
        q.className = griglia.className;
        var t = document.createElement('div');
        t.className = 'cassetto-testi';
        t.appendChild(testi[i]);
        pl = palco.cloneNode(true);
        q.appendChild(t);
        q.appendChild(pl);
        griglia.parentNode.insertBefore(q, griglia);
      }
      q.classList.add('cassetto-quadro');
      q.setAttribute('data-quadro', String(i + 1));
      return { p: p, dentro: i === 1, disegna: palcoCassetto(pl) };
    });
    sezione.setAttribute('data-quadri', '');
    // Con «vivo» (al telefono) ogni quadro entra quando arriva, una volta.
    Array.prototype.forEach.call(sezione.querySelectorAll('.cassetto-quadro'), function (q) { entra(q); });
    function disegna() {
      quadri.forEach(function (q) {
        for (var n = 0; n < 4; n++) { var w = q.disegna(q.p, q.dentro); w.fn(); if (!w.riposo) break; }
      });
    }
    disegna();
    var attesa = false;
    window.addEventListener('resize', function () {
      if (attesa) return;
      attesa = true;
      requestAnimationFrame(function () { attesa = false; parte('quadri', disegna); });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { parte('quadri', disegna); });
  }

  var cassetto = null;
  function faiQuadri() {
    var sezione = document.querySelector('[data-cassetto]');
    var palco = sezione && sezione.querySelector('[data-palco]');
    if (palco && !sezione.hasAttribute('data-quadri')) quadriFermi(sezione, palco);
  }
  parte('quadri', function () { if (!vivo) faiQuadri(); });
  vicino('[data-cassetto]', 'cassetto', function () {
    if (!vivo) return;
    var sezione = document.querySelector('[data-cassetto]');
    if (!sezione || sezione.hasAttribute('data-quadri')) return;
    if (!largo.matches) { faiQuadri(); return; }
    var fermo = sezione.querySelector('.cassetto-fermo');
    var palco = sezione.querySelector('[data-palco]');
    var testi = Array.prototype.slice.call(sezione.querySelectorAll('.cassetto-testo'));
    var disegna = palcoCassetto(palco);
    var prima = -1, primaL = -1, primaA = -1, fase = 0;
    testi.forEach(function (t, i) { t.toggleAttribute('data-attivo', i === 0); });
    sezione.setAttribute('data-segue', '');
    cassetto = function (vh, scarto) {
      // La finestra del browser è scesa sotto i 768 px: la scena lascia il posto ai tre quadri, e non torna.
      if (!largo.matches) {
        cassetto = null;
        return function () {
          sezione.removeAttribute('data-segue');
          testi.forEach(function (t) { t.removeAttribute('data-attivo'); });
          faiQuadri();
        };
      }
      var r = sezione.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      // 0 un quarto di schermo prima che la sezione si fermi sotto la testata, 1 poco prima che riparta: lo stato
      // finale resta un momento sullo schermo.
      var corsa = r.height - fermo.offsetHeight, anticipo = vh * 0.25;
      var p = Math.round(limita((64 + anticipo - r.top - scarto) / ((corsa > 0 ? corsa : 1) + anticipo - vh * 0.06)) * 1000) / 1000;
      var L = palco.clientWidth, A = palco.clientHeight;
      if (p === prima && L === primaL && A === primaA) return;
      prima = p; primaL = L; primaA = A;
      var w = disegna(p);
      if (w.riposo) { prima = -1; return function () { w.fn(); chiedi(); }; }
      return function () {
        w.fn();
        // I tre testi: uno alla volta, sempre pieni. Cambia solo quale si vede.
        var f = p < 0.12 ? 0 : p < 0.58 ? 1 : 2;
        if (f !== fase) { fase = f; testi.forEach(function (t, i) { t.toggleAttribute('data-attivo', i === f); }); }
      };
    };
  });

  /* ---------- Come funziona: il foglio scende nella casa e ne escono le scadenze, una volta sola ----------
     Ottavo giro (11/11): la scena non segue più lo scorrimento. Lo script la prepara (data-gioca) quando si avvicina e,
     quando è per quattro decimi sullo schermo, la fa partire (data-visto): il foglio scende, la casa batte, le tre
     scadenze escono, e i numeri dei tre passi si accendono uno dopo l'altro. Meno di un secondo, poi resta ferma. */
  vicino('[data-scena]', 'scena', function () {
    if (!vivo || !IO) return;
    var el = document.querySelector('[data-scena]');
    var passi = document.querySelector('[data-passi]');
    if (!el) return;
    el.setAttribute('data-gioca', '');
    var o = new IntersectionObserver(function (voci) {
      if (!voci[0].isIntersecting) return;
      o.disconnect();
      el.setAttribute('data-visto', '');
      if (passi) passi.setAttribute('data-visto', '');
    }, { threshold: 0.4 });
    o.observe(el);
  });

  /* ---------- L'articolo: il video parte quando è sullo schermo, muto e in loop ---------- */
  parte('video articolo', function () {
    var v = document.querySelector('[data-video-articolo]');
    if (!v || !vivo || !('IntersectionObserver' in window)) return;
    var quota = 0;
    iscrivi({ video: v, mp4: v.getAttribute('data-src'), peso: function () { return quota >= 0.35 ? 3 : 0; } });
    new IntersectionObserver(function (voci) { quota = voci[0].intersectionRatio; aggiornaVideo(); }, { threshold: [0, 0.35, 1] }).observe(v);
  });

  /* ---------- L'apertura: il ciclo bolletta, scatto, campi, scadenza (ottavo giro, 11/11) ----------
     Le animazioni stanno dietro data-sequenza="gira" (foglio di stile). Nella pagina il segno è vuoto: il ciclo non fa
     parte del primo caricamento. Lo script lo accende dopo che la pagina è pronta (l'evento load, più un momento
     libero): solo allora scarica la schermata «prima» (la lista senza la bolletta) e, quando è arrivata, fa partire il
     ciclo. Lo spegne quando l'apertura esce dallo schermo o la scheda del browser va in secondo piano, e lo riaccende
     al ritorno: riparte dal quadro fermo. */
  // Il ciclo non fa parte del primo caricamento (misurato: dentro la misura di Lighthouse costa una decina di punti).
  // A pagina pronta parte al primo movimento del mouse, tocco o tasto; se la persona guarda e basta, dopo sei secondi.
  var ATTESA_CICLO = 6000; // millisecondi dopo «load»
  parte('sequenza', function () {
    var seq = document.querySelector('[data-sequenza]');
    if (!vivo || !seq || !IO) return;
    var prima = seq.querySelector('.schermo-prima');
    var pronta = false, dentro = false;
    function aggiorna() {
      var gira = pronta && dentro && !fermi && !document.hidden;
      if (gira !== (seq.getAttribute('data-sequenza') === 'gira')) seq.setAttribute('data-sequenza', gira ? 'gira' : '');
    }
    function prepara() {
      var via = function () { pronta = true; aggiorna(); };
      var src = prima && prima.getAttribute('data-src');
      if (src && !prima.getAttribute('src')) {
        prima.addEventListener('load', via, { once: true });
        prima.setAttribute('src', src);
      } else via();
      new IntersectionObserver(function (voci) { dentro = voci[0].isIntersecting; aggiorna(); }, { threshold: 0.25 }).observe(seq);
      document.addEventListener('visibilitychange', aggiorna);
    }
    var partito = false;
    var GESTI = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'scroll'];
    var via = function () {
      if (partito) return;
      partito = true;
      GESTI.forEach(function (g) { window.removeEventListener(g, via); });
      quando(function () { parte('sequenza', prepara); }, { timeout: 2000 });
    };
    var parti = function () {
      GESTI.forEach(function (g) { window.addEventListener(g, via, { passive: true }); });
      setTimeout(via, ATTESA_CICLO);
    };
    if (document.readyState === 'complete') parti();
    else window.addEventListener('load', parti, { once: true });
  });

  /* ---------- Le risposte: la prima è aperta, le altre si aprono al clic (ottavo giro, 11/11) ----------
     Nella pagina sono un elenco di domande e risposte, tutte in chiaro: così restano senza script e con «meno
     animazioni». Con «vivo» ogni domanda diventa un pulsante (clic, tocco, Invio e Spazio: lo stesso gesto), col suo
     segno; la riga intera risponde al clic. Aprendo, la risposta si scrive in 0,7 secondi: il suo posto è già tutto
     occupato (il resto del testo c'è, invisibile), quindi la pagina non si muove mentre scrive. */
  var SCRITTURA = 700; // millisecondi
  dopo('risposte', function () {
    var elenco = document.querySelector('.risposte-elenco');
    if (!vivo || !elenco) return;
    Array.prototype.forEach.call(elenco.querySelectorAll('.risposta'), function (riga, i) {
      var dt = riga.querySelector('dt'), dd = riga.querySelector('dd');
      if (!dt || !dd) return;
      var testo = dd.textContent, giro = 0;
      var b = document.createElement('button'), segno = document.createElement('span'), domanda = document.createElement('span');
      b.type = 'button';
      b.className = 'risposta-bottone';
      segno.className = 'domanda-segno';
      segno.setAttribute('aria-hidden', 'true');
      domanda.textContent = dt.textContent;
      b.appendChild(segno);
      b.appendChild(domanda);
      if (!dd.id) dd.id = 'risposta-' + (i + 1);
      b.setAttribute('aria-controls', dd.id);
      dt.textContent = '';
      dt.appendChild(b);
      function metti(aperta, scrivi) {
        var mio = ++giro;
        b.setAttribute('aria-expanded', String(aperta));
        riga.toggleAttribute('data-aperta', aperta);
        dd.hidden = !aperta;
        dd.textContent = testo;
        if (!aperta || !scrivi || fermi) return;
        var inizio = performance.now();
        var fatto = document.createElement('span'), resto = document.createElement('span');
        resto.className = 'da-scrivere';
        resto.textContent = testo;
        dd.textContent = '';
        dd.appendChild(fatto);
        dd.appendChild(resto);
        (function passo(t) {
          if (mio !== giro) return;
          var n = Math.min(testo.length, Math.ceil(testo.length * (t - inizio) / SCRITTURA));
          fatto.textContent = testo.slice(0, n);
          resto.textContent = testo.slice(n);
          if (n < testo.length) requestAnimationFrame(passo);
          else dd.textContent = testo;
        })(inizio);
      }
      metti(i === 0, false);
      riga.addEventListener('click', function (e) {
        if (dd.contains(e.target)) return; // dentro la risposta si seleziona il testo
        metti(!riga.hasAttribute('data-aperta'), true);
      });
    });
    elenco.setAttribute('data-apri', '');
  });

  /* ---------- «Chi la usa»: la prova d'impaginazione (ottavo giro, 11/11) ----------
     La sezione vera la scrive il generatore, e solo se strumenti/chi-la-usa.mjs ha frasi di persone vere. Qui, con
     ?prova=1 e mai su dimorapp.com, lo script mette al suo posto (dopo la storia del quaderno) tre frasi FINTE,
     dichiarate tali nella sezione e in ogni frase: servono solo a vedere l'impaginazione. Stesse classi del generatore. */
  parte('chi la usa', function () {
    var host = location.hostname;
    if (!new URLSearchParams(location.search).has('prova') || host === 'dimorapp.com' || host === 'www.dimorapp.com') return;
    var dopoDi = document.getElementById('storia');
    if (!dopoDi || document.getElementById('chi-la-usa')) return;
    var sezione = document.createElement('section');
    sezione.className = 'sezione chi-la-usa';
    sezione.id = 'chi-la-usa';
    var FINTE = [
      'Frase finta numero uno, solo per provare l\u2019impaginazione: qui andranno due o tre righe scritte da una persona vera.',
      'Frase finta numero due, più corta.',
      'Frase finta numero tre, la più lunga, per vedere come sta un testo che va a capo più volte nello stesso riquadro senza che gli altri due si deformino.',
    ];
    sezione.innerHTML = '<div class="contenitore"><div class="sezione-testa"><h2 class="titolo-sezione">Chi la usa</h2></div>' +
      '<p class="chi-prova">Prova di impaginazione: le frasi qui sotto sono finte.</p><div class="voci-chi">' +
      FINTE.map(function (f) {
        return '<figure class="voce-chi"><blockquote><p>' + f + '</p></blockquote><figcaption><span class="voce-chi-nome">Nome finto</span> <span class="voce-chi-chi">frase di prova</span></figcaption></figure>';
      }).join('') + '</div></div>';
    dopoDi.insertAdjacentElement('afterend', sezione);
  });

  /* ---------- La testata: la riga sotto compare quando la pagina scorre ---------- */
  var testata = document.querySelector('[data-testata]');

  /* Dall'ottavo giro (11/11) lo scorrimento muove una scena sola, il fascicolo (da 768 px); dei racconti sceglie solo
     quale schermata mostrare, a scatto.
     Un solo giro per fotogramma, su scorrimento e ridimensionamento. In due tempi (quinto giro, 27/10): prima ogni
     parte legge le sue misure e restituisce cosa scrivere, poi si scrive tutto insieme. Letture e scritture alternate
     costringerebbero il browser a ricalcolare lo stile a ogni lettura, e sul telefono i fotogrammi salterebbero.
     Il ritardo morbido (sesto giro, 27/10): le scene non seguono lo scorrimento passo passo ma una posizione «lisciata»
     che lo insegue (arriva al 95% in circa 0,7 secondi, come lo «scrub» di uno ScrollTrigger). Ogni parte riceve lo
     scarto fra la pagina e la posizione lisciata e lo aggiunge alle sue misure: la scena è un poco indietro, e la
     raggiunge con dolcezza. Un salto grande (un'ancora del menu, Home, Fine) non si insegue: la scena va dov'è la
     pagina. La finestra dei racconti e la testata seguono la pagina com'è. */
  var inCoda = false;
  var RITARDO = 0.24;       // secondi: la costante del ritardo morbido
  var lisciato = null, ultimoGiro = 0;
  function giro(t) {
    inCoda = false;
    var ora = typeof t === 'number' ? t : performance.now();
    var vh = window.innerHeight;
    var y = window.scrollY;
    if (lisciato === null || Math.abs(y - lisciato) > vh * 1.5) lisciato = y;
    else {
      var dt = Math.min(0.1, Math.max(0, (ora - ultimoGiro) / 1000));
      lisciato += (y - lisciato) * (1 - Math.exp(-dt / RITARDO));
      if (Math.abs(y - lisciato) < 1) lisciato = y;
    }
    ultimoGiro = ora;
    var scarto = y - lisciato;
    var sotto = y > 8;
    var scritture = [];
    var leggi = function (nome, fn) { parte(nome, function () { var w = fn(); if (w) scritture.push([nome, w]); }); };
    if (cassetto) leggi('cassetto', function () { return cassetto(vh, scarto); });
    racconti.forEach(function (r) { leggi('racconto', function () { return r(vh); }); });
    if (testata) testata.toggleAttribute('data-sotto', sotto);
    scritture.forEach(function (w) { parte(w[0], w[1]); });
    // Finché la scena non ha raggiunto la pagina, un altro giro.
    if (scarto !== 0) chiedi();
  }
  function chiedi() { if (!inCoda) { inCoda = true; requestAnimationFrame(giro); } }
  window.addEventListener('scroll', chiedi, { passive: true });
  window.addEventListener('resize', chiedi);

  /* ---------- La rotellina del mouse, al computer: la pagina scivola invece di saltare (sesto giro, 27/10) ----------
     Solo con «vivo», un puntatore preciso e una rotellina vera: un touchpad (spostamenti piccoli o con la virgola, o di
     lato) e il telefono restano allo scorrimento del sistema, che è già morbido. La rotellina sposta una meta, e la
     pagina la insegue a ogni fotogramma (circa un terzo di secondo). La tastiera, le ancore del menu, la barra di
     scorrimento e la ricerca nella pagina restano del browser: appena la pagina si muove da sé, la rotellina lascia il
     passo. Dentro qualcosa che scorre da sé (un elenco) la rotellina resta del browser. */
  parte('rotella', function () {
    if (!vivo || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var meta = null, ora = 0, ultimo = 0, scritto = null, gira = false;
    var scorreDaSe = typeof WeakMap === 'function' ? new WeakMap() : null;
    function dentroUnoScorrimento(el) {
      if (scorreDaSe && scorreDaSe.has(el)) return scorreDaSe.get(el);
      var si = false;
      for (var a = el; a && a.nodeType === 1 && a !== document.body && a !== radice; a = a.parentElement) {
        var oy = window.getComputedStyle(a).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && a.scrollHeight > a.clientHeight + 1) { si = true; break; }
      }
      if (scorreDaSe) scorreDaSe.set(el, si);
      return si;
    }
    function lascia() { meta = null; scritto = null; }
    function passo(t) {
      if (meta === null) { gira = false; return; }
      // La pagina s'è mossa da sé (tastiera, ancora, barra): la rotellina lascia il passo.
      if (scritto !== null && Math.abs(window.scrollY - scritto) > 2) { lascia(); gira = false; return; }
      var dt = Math.min(0.05, Math.max(0, (t - ultimo) / 1000));
      ultimo = t;
      ora += (meta - ora) * (1 - Math.exp(-dt / 0.11));
      if (Math.abs(meta - ora) < 0.5) ora = meta;
      window.scrollTo({ top: ora, behavior: 'instant' });
      scritto = ora;
      if (ora === meta) { lascia(); gira = false; return; }
      requestAnimationFrame(passo);
    }
    window.addEventListener('wheel', function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.deltaX !== 0 || e.deltaY === 0) return;
      var dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (e.deltaMode === 0 && (Math.abs(dy) < 40 || Math.abs(dy - Math.round(dy)) > 0.01)) { lascia(); return; }
      if (e.target && e.target.nodeType === 1 && dentroUnoScorrimento(e.target)) return;
      e.preventDefault();
      var massimo = Math.max(0, radice.scrollHeight - window.innerHeight);
      if (meta === null) { meta = ora = window.scrollY; }
      meta = Math.max(0, Math.min(massimo, meta + dy));
      if (!gira) { gira = true; ultimo = performance.now(); requestAnimationFrame(passo); }
    }, { passive: false });
    ['keydown', 'mousedown', 'touchstart'].forEach(function (t) { window.addEventListener(t, lascia, { passive: true }); });
    // Un clic (anche dato da tastiera o da un lettore di schermo) e un salto a un'ancora fermano la rotellina prima che
    // il browser cominci a scorrere da sé: altrimenti la rotellina riporterebbe la pagina dov'era.
    document.addEventListener('click', lascia, true);
    window.addEventListener('hashchange', lascia);
  });
  // Le sezioni più in basso cambiano altezza quando il browser le impagina (content-visibility): la scena che segue
  // lo scorrimento si rimette al passo anche senza che la pagina scorra.
  if ('ResizeObserver' in window) new ResizeObserver(chiedi).observe(document.body);
  giro();
  // La coda parte al primo gesto; con un indirizzo che porta a una sezione (/#novita), subito.
  if (metaIniziale) { subito(); coda.finita = true; requestAnimationFrame(function () { if (!scorsoDaSe) metaIniziale.scrollIntoView(); }); }
  else {
    var primoGesto = function () {
      avviaCoda();
      ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) { window.removeEventListener(t, primoGesto); });
    };
    ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) { window.addEventListener(t, primoGesto, { passive: true }); });
  }

  /* Se il sistema passa a «meno animazioni» mentre la pagina è aperta: i video si fermano (e il foglio di stile ferma
     il resto: il ciclo dell'apertura, la fila dei nomi, le entrate). */
  parte('meno animazioni', function () {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var ferma = function () { if (mq.matches) { fermi = true; document.querySelectorAll('video').forEach(function (v) { v.pause(); }); } };
    if (mq.addEventListener) mq.addEventListener('change', ferma);
  });
})();
