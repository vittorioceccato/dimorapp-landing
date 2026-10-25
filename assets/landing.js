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
  parte('parole', function () {
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

  /* ---------- I numeri che contano, quando entrano nello schermo ---------- */
  parte('numeri', function () {
    if (!vivo || !('IntersectionObserver' in window)) return;
    function scrivi(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    var numeri = document.querySelectorAll('[data-conta]');
    var osserva = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        osserva.unobserve(v.target);
        var el = v.target, fine = +el.getAttribute('data-conta');
        var inizio = null, durata = 1400;
        function passo(t) {
          if (inizio === null) inizio = t;
          var x = limita((t - inizio) / durata);
          var e = 1 - Math.pow(1 - x, 3);
          el.textContent = scrivi(Math.round(fine * e));
          if (x < 1) requestAnimationFrame(passo);
        }
        requestAnimationFrame(passo);
      });
    }, { threshold: 0.6 });
    numeri.forEach(function (el) {
      // Chi usa un lettore di schermo sente il valore finale, non il conto.
      var tutto = el.closest('.numero') || el;
      var fermo = document.createElement('span');
      fermo.className = 'nascosto';
      fermo.textContent = tutto.textContent.replace(/\s+/g, ' ').trim();
      tutto.parentNode.insertBefore(fermo, tutto);
      tutto.setAttribute('aria-hidden', 'true');
      // Lo spazio della cifra resta quello del valore finale: il conto non sposta le parole accanto.
      el.style.display = 'inline-block';
      el.style.minWidth = el.getBoundingClientRect().width + 'px';
      el.textContent = '0';
      osserva.observe(el);
    });
  });

  /* ---------- Il racconto: la finestra ferma e i video che cambiano con lo scorrimento ----------
     La finestra si costruisce dalle storie della pagina (data-storia): per ognuna un'immagine ferma e un video senza
     indirizzo. L'indirizzo del video si scrive solo quando la sua storia diventa quella sullo schermo: nessun video
     si scarica prima. Gira un solo video alla volta, e nessuno quando il racconto non è sullo schermo. */
  var racconto = null;
  parte('racconto', function () {
    if (!vivo) return;
    var sezione = document.querySelector('[data-racconto]');
    if (!sezione) return;
    var storie = Array.prototype.slice.call(sezione.querySelectorAll('[data-storia]'));
    var schermo = sezione.querySelector('[data-schermo]');
    var avanzamento = sezione.querySelector('[data-avanzamento]');
    var finestra = sezione.querySelector('[data-finestra]');
    var griglia = sezione.querySelector('.racconto-griglia');
    var contenitore = sezione.querySelector('.racconto-schermo');
    if (!storie.length || !schermo) return;

    var slide = storie.map(function (s, i) {
      var id = s.getAttribute('data-storia');
      var d = document.createElement('div');
      d.className = 'slide';
      var img = document.createElement('img');
      img.src = '/assets/novita/' + id + '.webp'; img.alt = ''; img.width = 960; img.height = 600;
      img.decoding = 'async'; img.loading = i < 2 ? 'eager' : 'lazy';
      var v = document.createElement('video');
      v.className = 'schermo-video'; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'none';
      v.setAttribute('disablepictureinpicture', '');
      v.width = 960; v.height = 600;
      v.addEventListener('playing', function () { v.setAttribute('data-gira', ''); });
      d.appendChild(img); d.appendChild(v);
      schermo.appendChild(d);
      var seg = document.createElement('span');
      avanzamento.appendChild(seg);
      return { el: d, video: v, mp4: '/assets/novita/' + id + '.mp4', seg: seg, storia: s };
    });
    sezione.setAttribute('data-pronto', '');

    var attiva = -1, inVista = false;
    function suona() {
      slide.forEach(function (s, i) {
        if (i === attiva && inVista && !risparmio) {
          if (!s.video.getAttribute('src')) s.video.setAttribute('src', s.mp4);
          var p = s.video.play();
          if (p && p.catch) p.catch(function () { /* l'autoplay può essere negato: resta l'immagine */ });
        } else if (!s.video.paused) {
          s.video.pause();
        }
      });
    }
    function scegli(i) {
      if (i === attiva) return;
      attiva = i;
      slide.forEach(function (s, k) {
        var on = k === i;
        s.el.toggleAttribute('data-attiva', on);
        s.seg.toggleAttribute('data-attiva', on);
        s.storia.toggleAttribute('data-attiva', on);
      });
      suona();
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (voci) {
        inVista = voci[0].isIntersecting; suona();
      }, { rootMargin: '0px' }).observe(griglia);
    } else { inVista = true; }

    racconto = function (vh) {
      var g = griglia.getBoundingClientRect();
      finestra.style.setProperty('--entrata', limita((vh - g.top) / (vh * 0.55)).toFixed(3));
      // La linea di riferimento: al computer il centro dello schermo; al telefono il centro di quello che resta sotto
      // la finestra ferma.
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
    };
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

  /* ---------- L'apertura: la casa sale appena, più piano della pagina ---------- */
  var apertura = null;
  parte('apertura', function () {
    if (!vivo) return;
    var sezione = document.querySelector('.apertura');
    var casa = document.querySelector('[data-casa]');
    if (!sezione || !casa) return;
    apertura = function () {
      var h = sezione.offsetHeight || 1;
      casa.style.setProperty('--p-apertura', limita(window.scrollY / h).toFixed(3));
    };
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
    if (racconto) parte('racconto', function () { racconto(vh); });
  }
  function chiedi() { if (!inCoda) { inCoda = true; requestAnimationFrame(giro); } }
  window.addEventListener('scroll', chiedi, { passive: true });
  window.addEventListener('resize', chiedi);
  giro();

  /* ---------- L'articolo: il video parte quando è sullo schermo, muto e in loop ---------- */
  parte('video articolo', function () {
    var v = document.querySelector('[data-video-articolo]');
    if (!v || !vivo || risparmio || !('IntersectionObserver' in window)) return;
    v.addEventListener('playing', function () { v.setAttribute('data-gira', ''); });
    new IntersectionObserver(function (voci) {
      if (voci[0].isIntersecting) {
        if (!v.getAttribute('src')) v.setAttribute('src', v.getAttribute('data-src'));
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* resta l'immagine */ });
      } else if (!v.paused) { v.pause(); }
    }, { threshold: 0.35 }).observe(v);
  });

  /* Se il sistema passa a «meno animazioni» mentre la pagina è aperta: i video si fermano. */
  parte('meno animazioni', function () {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var ferma = function () { if (mq.matches) document.querySelectorAll('video').forEach(function (v) { v.pause(); }); };
    if (mq.addEventListener) mq.addEventListener('change', ferma);
  });
})();
