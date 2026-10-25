/* Dimora, la landing (25/10/2026). Uno script solo, nessuna dipendenza, nessuna chiamata a terzi.
   Ogni parte si accende da sé: se una fallisce, le altre restano, e senza script la pagina si legge tutta.
   Le animazioni partono solo se la testa della pagina ha messo «vivo» sull'<html> (cioè senza «meno animazioni»). */
(function () {
  'use strict';

  var radice = document.documentElement;
  var vivo = radice.classList.contains('vivo');
  var risparmio = false;
  try { risparmio = !!(navigator.connection && navigator.connection.saveData); } catch (e) { /* niente */ }

  function parte(nome, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn('[landing] ' + nome, e); }
  }
  function limita(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  // Quello che serve più in basso si prepara quando il browser è libero: la prima schermata si disegna prima.
  var inAttesa = [];
  function dopo(nome, fn) { inAttesa.push([nome, fn]); }

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
      if (a && a.pathname === location.pathname && a.hash) pieno();
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

  /* ---------- Le parole dei titoli, una alla volta, quando il titolo entra nello schermo ---------- */
  dopo('parole', function () {
    if (!vivo || !('IntersectionObserver' in window)) return;
    var titoli = document.querySelectorAll('[data-parole]');
    var osserva = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.setAttribute('data-visto', ''); osserva.unobserve(v.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    titoli.forEach(function (t) {
      var parole = t.textContent.trim().split(/\s+/);
      t.setAttribute('aria-label', t.textContent.trim());
      t.textContent = '';
      parole.forEach(function (p, i) {
        var s = document.createElement('span');
        s.className = 'parola';
        s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--k', String(i));
        s.textContent = p;
        t.appendChild(s);
        if (i < parole.length - 1) t.appendChild(document.createTextNode(' '));
      });
      osserva.observe(t);
    });
  });

  /* ---------- I disegni delle sezioni: si tracciano quando arrivano sullo schermo ---------- */
  dopo('disegni', function () {
    if (!vivo || !('IntersectionObserver' in window)) return;
    var osserva = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.setAttribute('data-visto', ''); osserva.unobserve(v.target); }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-disegno]').forEach(function (d) { osserva.observe(d); });
  });

  /* ---------- Un video alla volta ----------
     Ogni video della pagina (le finestre dei racconti, le carte delle novità, l'articolo) si iscrive qui con un peso:
     quanto «vuole» girare adesso. Gira solo quello col peso più alto, gli altri si fermano. L'indirizzo del video si
     scrive la prima volta che tocca a lui: nessun video si scarica prima. Con «risparmio dati» non ne gira nessuno. */
  var candidati = [];
  function iscrivi(c) {
    c.video.addEventListener('playing', function () { c.video.setAttribute('data-gira', ''); });
    candidati.push(c);
  }
  function aggiornaVideo() {
    var scelto = null, massimo = 0;
    candidati.forEach(function (c) { var p = c.peso(); if (p > massimo) { massimo = p; scelto = c; } });
    candidati.forEach(function (c) {
      if (c === scelto && !risparmio) {
        if (!c.video.getAttribute('src')) c.video.setAttribute('src', c.mp4);
        if (c.video.paused) {
          var p = c.video.play();
          if (p && p.catch) p.catch(function () { /* l'autoplay può essere negato: resta l'immagine */ });
        }
      } else if (!c.video.paused) {
        c.video.pause();
      }
    });
  }
  function nuovoVideo() {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('aria-hidden', 'true');
    v.width = 960; v.height = 600;
    return v;
  }

  /* ---------- I racconti: la finestra ferma e i video che cambiano con lo scorrimento ----------
     Tre racconti (Come funziona, Se affitti, Seconda casa), ognuno con la sua finestra. La finestra si costruisce dalle
     storie (data-storia): per ognuna un'immagine ferma e, se è una storia delle novità, il suo video. Il passo delle
     bollette (data-immagine) ha solo la schermata. */
  var racconti = [];
  dopo('racconti', function () {
    if (!vivo) return;
    document.querySelectorAll('[data-racconto]').forEach(function (sezione) {
      parte('racconto', function () {
        var storie = Array.prototype.slice.call(sezione.querySelectorAll('[data-storia]'));
        var schermo = sezione.querySelector('[data-schermo]');
        var avanzamento = sezione.querySelector('[data-avanzamento]');
        var finestra = sezione.querySelector('[data-finestra]');
        var griglia = sezione.querySelector('.racconto-griglia');
        var contenitore = sezione.querySelector('.racconto-schermo');
        if (!storie.length || !schermo) return;

        var attiva = -1, inVista = false;
        var slide = storie.map(function (s, i) {
          var id = s.getAttribute('data-storia');
          var immagine = s.getAttribute('data-immagine');
          var d = document.createElement('div');
          d.className = 'slide';
          var img = document.createElement('img');
          img.src = immagine || '/assets/novita/' + id + '.webp'; img.alt = '';
          img.width = immagine ? 1280 : 960; img.height = immagine ? 800 : 600;
          img.decoding = 'async'; img.loading = i < 1 ? 'eager' : 'lazy';
          d.appendChild(img);
          if (!immagine) {
            var v = nuovoVideo();
            v.className = 'schermo-video';
            d.appendChild(v);
            iscrivi({ video: v, mp4: '/assets/novita/' + id + '.mp4', peso: function () { return i === attiva && inVista ? 2 : 0; } });
          }
          schermo.appendChild(d);
          var seg = document.createElement('span');
          if (avanzamento) avanzamento.appendChild(seg);
          return { el: d, seg: seg, storia: s };
        });
        sezione.setAttribute('data-pronto', '');

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
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (voci) { inVista = voci[0].isIntersecting; aggiornaVideo(); }).observe(griglia);
        } else { inVista = true; }
        if (slide.length === 1) scegli(0);

        racconti.push(function (vh) {
          var g = griglia.getBoundingClientRect();
          finestra.style.setProperty('--entrata', limita((vh - g.top) / (vh * 0.55)).toFixed(3));
          if (slide.length === 1) return;
          // La linea di riferimento: al computer il centro dello schermo; al telefono il centro di quello che resta
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
          scegli(migliore);
        });
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

  /* ---------- Come funziona: il foglio scende nella casa e ne escono le scadenze ---------- */
  var scena = null;
  parte('scena', function () {
    if (!vivo) return;
    var el = document.querySelector('[data-scena]');
    var passi = document.querySelectorAll('[data-passi] > li');
    if (!el) return;
    function morbido(x) { return x * x * (3 - 2 * x); }
    scena = function (vh) {
      var r = el.getBoundingClientRect();
      var inizio = vh * 0.92, fine = vh * 0.42 - r.height / 2;
      var p = limita((inizio - r.top) / (inizio - fine));
      el.style.setProperty('--foglio', morbido(limita(p / 0.42)).toFixed(3));
      var c = (p - 0.36) / 0.2;
      el.style.setProperty('--casa', (c > 0 && c < 1 ? Math.sin(Math.PI * c) : 0).toFixed(3));
      el.style.setProperty('--r1', morbido(limita((p - 0.5) / 0.14)).toFixed(3));
      el.style.setProperty('--r2', morbido(limita((p - 0.62) / 0.14)).toFixed(3));
      el.style.setProperty('--r3', morbido(limita((p - 0.74) / 0.14)).toFixed(3));
      var passo = p < 0.4 ? 0 : p < 0.7 ? 1 : 2;
      passi.forEach(function (li, i) { li.toggleAttribute('data-attivo', i === passo); });
    };
  });

  /* ---------- L'apertura: il computer, il telefono e la foto salgono appena, a velocità diverse ---------- */
  var apertura = null;
  parte('apertura', function () {
    if (!vivo) return;
    var sezione = document.querySelector('.apertura');
    if (!sezione) return;
    apertura = function () {
      var h = sezione.offsetHeight || 1;
      sezione.style.setProperty('--p-apertura', limita(window.scrollY / h).toFixed(3));
    };
  });

  /* ---------- L'articolo: il video parte quando è sullo schermo, muto e in loop ---------- */
  parte('video articolo', function () {
    var v = document.querySelector('[data-video-articolo]');
    if (!v || !vivo || !('IntersectionObserver' in window)) return;
    var quota = 0;
    iscrivi({ video: v, mp4: v.getAttribute('data-src'), peso: function () { return quota >= 0.35 ? 3 : 0; } });
    new IntersectionObserver(function (voci) { quota = voci[0].intersectionRatio; aggiornaVideo(); }, { threshold: [0, 0.35, 1] }).observe(v);
  });

  /* ---------- La testata: la riga sotto compare quando la pagina scorre ---------- */
  var testata = document.querySelector('[data-testata]');

  /* Un solo giro per fotogramma, su scorrimento e ridimensionamento. */
  var inCoda = false;
  function giro() {
    inCoda = false;
    var vh = window.innerHeight;
    if (testata) testata.toggleAttribute('data-sotto', window.scrollY > 8);
    if (apertura) parte('apertura', apertura);
    if (scena) parte('scena', function () { scena(vh); });
    racconti.forEach(function (r) { parte('racconto', function () { r(vh); }); });
  }
  function chiedi() { if (!inCoda) { inCoda = true; requestAnimationFrame(giro); } }
  window.addEventListener('scroll', chiedi, { passive: true });
  window.addEventListener('resize', chiedi);
  giro();
  // Una parte per volta, ognuna nel suo momento libero: nessun compito lungo che blocchi la pagina.
  var quando = window.requestIdleCallback || function (f) { return setTimeout(f, 120); };
  (function prossima() {
    var x = inAttesa.shift();
    if (!x) { aggiornaVideo(); chiedi(); if (metaIniziale && !scorsoDaSe) metaIniziale.scrollIntoView(); return; }
    quando(function () { parte(x[0], x[1]); chiedi(); prossima(); }, { timeout: 1500 });
  })();

  /* Se il sistema passa a «meno animazioni» mentre la pagina è aperta: i video si fermano. */
  parte('meno animazioni', function () {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var ferma = function () { if (mq.matches) { risparmio = true; document.querySelectorAll('video').forEach(function (v) { v.pause(); }); } };
    if (mq.addEventListener) mq.addEventListener('change', ferma);
  });
})();
