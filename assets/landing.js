/* Dimora, la landing (25/10/2026). Uno script solo, nessuna dipendenza, nessuna chiamata a terzi.
   Ogni parte si accende da sé: se una fallisce, le altre restano, e senza script la pagina si legge tutta.
   Le animazioni partono solo se la testa della pagina ha messo «vivo» sull'<html> (cioè senza «meno animazioni»). */
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

  /* ---------- Il numero dei documenti: segue la corsa della casa grande (scena B) ----------
     Senza script (e con «meno animazioni») il numero è già al suo valore. Chi usa un lettore di schermo sente il
     valore finale, non il conto; lo spazio della cifra resta quello del valore finale. Finché la scena non è sullo
     schermo la cifra resta «120»: chi legge il testo della pagina senza scorrere non trova mai «Più di 0». */
  var contatore = null;
  dopo('numero', function () {
    if (!vivo) return;
    var el = document.querySelector('[data-conta]');
    if (!el) return;
    var fine = +el.getAttribute('data-conta');
    var tutto = el.closest('[data-numero]') || el;
    var fermo = document.createElement('span');
    fermo.className = 'nascosto';
    fermo.textContent = tutto.textContent.replace(/\s+/g, ' ').trim();
    tutto.insertBefore(fermo, tutto.firstChild);
    Array.prototype.forEach.call(tutto.children, function (c) { if (c !== fermo) c.setAttribute('aria-hidden', 'true'); });
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    var scritto = String(fine);
    contatore = function (p, inVista) {
      var t = inVista ? String(Math.round(fine * p)) : String(fine);
      if (t !== scritto) { el.textContent = t; scritto = t; }
    };
  });

  /* ---------- I disegni delle sezioni: il tratto segue lo scorrimento ----------
     Scendendo si disegnano, risalendo si cancellano (terzo giro di Vitto, 25/10). L'avanzamento viene dalla posizione
     del disegno nello schermo: 0 quando entra dal basso, 1 quando il suo centro arriva a metà schermo. Ogni tratto ha il
     suo turno (--i nello stile), il tocco ambra è l'ultimo. Lo script prende il disegno solo quando l'ha preparato
     (data-segue): senza, è già tutto disegnato. */
  var disegni = [];
  var CORSA = 2.4;
  dopo('disegni', function () {
    if (!vivo) return;
    document.querySelectorAll('[data-disegno]').forEach(function (d) {
      var tratti = Array.prototype.slice.call(d.querySelectorAll('svg > *')).map(function (el) {
        var m = /--i:\s*([\d.]+)/.exec(el.getAttribute('style') || '');
        return { el: el, i: m ? +m[1] : 0, porta: el.classList.contains('porta') };
      });
      var ultimo = tratti.reduce(function (x, t) { return Math.max(x, t.i); }, 0);
      var prima = -1;
      var scena = d.closest('[data-casa-scena]');
      d.setAttribute('data-segue', '');
      disegni.push(function (vh) {
        var r = (scena || d).getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        var p;
        if (scena) {
          // La scena B: 0 un quarto di schermo prima che la scena si fermi, 1 alla fine della corsa da ferma.
          var corsa = r.height - scena.firstElementChild.offsetHeight;
          p = limita((64 + vh * 0.25 - r.top) / (corsa + vh * 0.25));
          var conta = contatore, inVista = r.top < vh, pc = p;
        } else {
          // 0 quando il bordo alto è ancora a un ventesimo dal fondo dello schermo, 1 quando il centro arriva a metà.
          p = limita((vh * 0.95 - r.top) / (vh * 0.45 + r.height * 0.5));
        }
        p = Math.round(p * 1000) / 1000;
        if (p === prima) return;
        prima = p;
        return function () {
        if (conta) conta(pc, inVista);
        tratti.forEach(function (t) {
          // Ogni tratto cresce lungo CORSA turni della corsa (quarto giro, 26/10: il tratto si vede
          // crescere e calare); l'ultimo, il tocco ambra, si chiude solo a p = 1.
          var x = limita((p * (ultimo + CORSA) - t.i) / CORSA);
          t.el.style.strokeDashoffset = String(1 - x);
          if (t.porta) t.el.style.fillOpacity = String(limita(x * 2 - 1));
        });
        };
      });
    });
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
          var videoPasso = s.getAttribute('data-video');
          var d = document.createElement('div');
          d.className = 'slide';
          var img = document.createElement('img');
          img.src = immagine || '/assets/novita/' + id + '.webp'; img.alt = '';
          img.width = immagine && !videoPasso ? 1280 : 960; img.height = immagine && !videoPasso ? 800 : 600;
          img.decoding = 'async'; img.loading = i < 1 ? 'eager' : 'lazy';
          d.appendChild(img);
          if (!immagine || videoPasso) {
            var v = nuovoVideo();
            v.className = 'schermo-video';
            d.appendChild(v);
            iscrivi({ video: v, mp4: videoPasso || '/assets/novita/' + id + '.mp4', peso: function () { return i === attiva && inVista ? 2 : 0; } });
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
          if (g.bottom < -vh || g.top > vh * 2) return;
          var entrata = limita((vh - g.top) / (vh * 0.55)).toFixed(3);
          if (slide.length === 1) return function () { finestra.style.setProperty('--entrata', entrata); };
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
          return function () { finestra.style.setProperty('--entrata', entrata); scegli(migliore); };
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

  /* ---------- Scena A, «dal cassetto al fascicolo»: la sezione ferma e lo scorrimento che manda avanti la scena ----------
     p va da 0 (la sezione arriva sotto la testata) a 1 (fine della corsa). I tempi, in p:
       0-0,10    le carte sparse, coi posti dove stanno oggi («nella mail», «nel cassetto», «nei download»);
       0,05-0,12 compaiono le tre cartelle;
       0,10-0,45 le carte volano nelle cartelle, una dopo l'altra;
       0,42-0,54 la cartella di via Roma si apre fino a riempire il palco, le altre se ne vanno;
       0,52-0,66 i gruppi di documenti, uno dopo l'altro;
       0,66-0,92 dal contratto escono i tre cartellini, l'ultimo (la scadenza, col punto ambra) per ultimo.
     I testi: il primo fino a 0,18, il secondo da 0,23 a 0,65, il terzo da 0,65. Si scrivono solo trasformazioni e
     opacità: l'impaginazione non si muove. Risalendo, gli stessi conti all'indietro. */
  var cassetto = null;
  dopo('cassetto', function () {
    if (!vivo) return;
    var sezione = document.querySelector('[data-cassetto]');
    if (!sezione) return;
    var fermo = sezione.querySelector('.cassetto-fermo');
    var palco = sezione.querySelector('[data-palco]');
    var testi = Array.prototype.slice.call(sezione.querySelectorAll('.cassetto-testo'));
    var carte = Array.prototype.slice.call(sezione.querySelectorAll('[data-carta]')).map(function (el) {
      var da = el.getAttribute('data-da').split(',').map(Number);
      return { el: el, x: da[0], y: da[1], r: da[2], dove: sezione.querySelector('[data-cartella="' + el.getAttribute('data-in') + '"]') };
    });
    var cartelle = Array.prototype.slice.call(sezione.querySelectorAll('[data-cartella]'));
    var roma = sezione.querySelector('[data-cartella="roma"]');
    var aperto = sezione.querySelector('[data-aperto]');
    var testa = aperto.querySelector('.fa-testa');
    var righe = Array.prototype.slice.call(aperto.querySelectorAll('[data-riga]'));
    var fonte = aperto.querySelector('[data-fonte]');
    var cartellini = Array.prototype.slice.call(sezione.querySelectorAll('[data-cartellino]'));
    var morbido = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var tra = function (p, a, b) { return limita((p - a) / (b - a)); };
    var prima = -1, primaL = -1, primaA = -1;
    sezione.setAttribute('data-segue', '');
    cassetto = function (vh) {
      var r = sezione.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var corsa = r.height - fermo.offsetHeight;
      var p = Math.round(limita((64 - r.top) / (corsa > 0 ? corsa : 1)) * 1000) / 1000;
      var L = palco.clientWidth, A = palco.clientHeight;
      if (p === prima && L === primaL && A === primaA) return;
      prima = p; primaL = L; primaA = A;
      // Letture prima delle scritture: le misure di riposo (offset) non dipendono dalle trasformazioni.
      var cw = carte[0].el.offsetWidth, ch = carte[0].el.offsetHeight;
      var dove = carte.map(function (c) { return { x: c.dove.offsetLeft + c.dove.offsetWidth / 2 - cw / 2, y: c.dove.offsetTop + c.dove.offsetHeight * 0.45 - ch / 2 }; });
      var R = { x: roma.offsetLeft, y: roma.offsetTop, w: roma.offsetWidth, h: roma.offsetHeight };
      var P = { x: aperto.offsetLeft, y: aperto.offsetTop, w: aperto.offsetWidth, h: aperto.offsetHeight };
      var F = { x: P.x + fonte.offsetLeft + fonte.offsetWidth / 2, y: P.y + fonte.offsetTop + fonte.offsetHeight / 2 };
      var T = cartellini.map(function (t) { return { x: t.offsetLeft + t.offsetWidth / 2, y: t.offsetTop + t.offsetHeight / 2 }; });

      return function () {
      // Le carte.
      carte.forEach(function (c, i) {
        var k = morbido(tra(p, 0.10 + i * 0.035, 0.27 + i * 0.035));
        var x = c.x * L + (dove[i].x - c.x * L) * k;
        var y = c.y * A + (dove[i].y - c.y * A) * k;
        var s = 1 - 0.78 * k;
        c.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (c.r * (1 - k)).toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
        c.el.style.opacity = String(limita((1 - k) * 5));
      });
      // Le cartelle: compaiono, poi lasciano il posto alla cartella aperta.
      var compare = morbido(tra(p, 0.05, 0.12));
      var apre = morbido(tra(p, 0.42, 0.54));
      cartelle.forEach(function (el) {
        var via = el === roma ? limita(apre * 4) : apre;
        el.style.opacity = String(compare * (1 - via));
        el.style.transform = 'translateY(' + ((1 - compare) * 24 + (el === roma ? 0 : via * 18)).toFixed(1) + 'px)';
      });
      // La cartella di via Roma che si apre.
      aperto.style.opacity = String(limita(apre * 8));
      aperto.style.transform = 'translate(' + ((R.x - P.x) * (1 - apre)).toFixed(1) + 'px,' + ((R.y - P.y) * (1 - apre)).toFixed(1) + 'px) scale(' +
        (R.w / P.w + (1 - R.w / P.w) * apre).toFixed(4) + ',' + (R.h / P.h + (1 - R.h / P.h) * apre).toFixed(4) + ')';
      testa.style.opacity = String(tra(p, 0.50, 0.55));
      righe.forEach(function (riga, j) {
        var o = morbido(tra(p, 0.52 + j * 0.03, 0.58 + j * 0.03));
        riga.style.opacity = String(o);
        riga.style.transform = 'translateY(' + ((1 - o) * 10).toFixed(1) + 'px)';
      });
      // I cartellini escono dal contratto e si posano.
      cartellini.forEach(function (t, j) {
        var k = morbido(tra(p, 0.66 + j * 0.08, 0.78 + j * 0.08));
        t.style.opacity = String(limita(k * 3));
        t.style.transform = 'translate(' + ((F.x - T[j].x) * (1 - k)).toFixed(1) + 'px,' + ((F.y - T[j].y) * (1 - k)).toFixed(1) + 'px) scale(' + (0.5 + 0.5 * k).toFixed(3) + ')';
      });
      // I tre testi.
      var o1 = 1 - tra(p, 0.18, 0.23), o2 = tra(p, 0.23, 0.28) * (1 - tra(p, 0.60, 0.65)), o3 = tra(p, 0.65, 0.70);
      [o1, o2, o3].forEach(function (o, j) {
        testi[j].style.opacity = String(o);
        testi[j].style.transform = 'translateY(' + ((1 - o) * 14).toFixed(1) + 'px)';
      });
      };
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
      return function () {
      el.style.setProperty('--foglio', morbido(limita(p / 0.42)).toFixed(3));
      var c = (p - 0.36) / 0.2;
      el.style.setProperty('--casa', (c > 0 && c < 1 ? Math.sin(Math.PI * c) : 0).toFixed(3));
      el.style.setProperty('--r1', morbido(limita((p - 0.5) / 0.14)).toFixed(3));
      el.style.setProperty('--r2', morbido(limita((p - 0.62) / 0.14)).toFixed(3));
      el.style.setProperty('--r3', morbido(limita((p - 0.74) / 0.14)).toFixed(3));
      var passo = p < 0.4 ? 0 : p < 0.7 ? 1 : 2;
      passi.forEach(function (li, i) { li.toggleAttribute('data-attivo', i === passo); });
      };
    };
  });

  /* ---------- L'apertura: il computer, il telefono e la foto salgono appena, a velocità diverse ---------- */
  var apertura = null;
  parte('apertura', function () {
    if (!vivo) return;
    var sezione = document.querySelector('.apertura');
    if (!sezione) return;
    var prima = '';
    var oggetti = [['.portatile', -16], ['.telefono', -40], ['.foto-carta', -28, 'rotate(-7deg) ']].map(function (x) {
      return { el: sezione.querySelector(x[0]), su: x[1], prima: x[2] };
    }).filter(function (o) { return o.el; });
    apertura = function () {
      var h = sezione.offsetHeight || 1;
      var v = limita(window.scrollY / h).toFixed(3);
      if (v === prima) return;
      prima = v;
      // Le trasformazioni si scrivono sui tre oggetti, non una variabile sulla sezione: una variabile sulla sezione
      // farebbe ricalcolare lo stile di tutto quello che c'è dentro, a ogni fotogramma.
      return function () {
        var q = +v;
        oggetti.forEach(function (o) { o.el.style.transform = (o.prima || '') + 'translateY(' + (q * o.su).toFixed(1) + 'px)'; });
      };
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

  /* ---------- L'apertura: la sequenza bolletta, foto, app riparte quando l'apertura torna sullo schermo ----------
     Le animazioni stanno dietro data-sequenza="gira": tolto quando l'apertura esce dallo schermo e rimesso quando ci
     torna, la sequenza riparte dall'inizio (quinto giro, 27/10). */
  dopo('sequenza', function () {
    var seq = document.querySelector('[data-sequenza]');
    if (!vivo || !seq || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (voci) {
      var dentro = voci[0].isIntersecting;
      if (!dentro) seq.setAttribute('data-sequenza', '');
      else if (seq.getAttribute('data-sequenza') !== 'gira') seq.setAttribute('data-sequenza', 'gira');
    }).observe(seq);
  });

  /* ---------- Le risposte: le righe entrano una dopo l'altra con lo scorrimento, e risalendo tornano indietro ---------- */
  var risposte = [];
  dopo('risposte', function () {
    if (!vivo) return;
    document.querySelectorAll('.risposta').forEach(function (riga) {
      var prima = -1;
      riga.setAttribute('data-segue', '');
      risposte.push(function (vh) {
        var r = riga.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        // Entra fra il 95% e il 75% dello schermo.
        var o = Math.round(limita((vh * 0.95 - r.top) / (vh * 0.2)) * 100) / 100;
        if (o === prima) return;
        prima = o;
        return function () {
          riga.style.opacity = String(o);
          riga.style.transform = 'translateY(' + ((1 - o) * 28).toFixed(1) + 'px)';
        };
      });
    });
  });

  /* ---------- La testata: la riga sotto compare quando la pagina scorre ---------- */
  var testata = document.querySelector('[data-testata]');

  /* Un solo giro per fotogramma, su scorrimento e ridimensionamento. In due tempi (quinto giro, 27/10): prima ogni
     parte legge le sue misure e restituisce cosa scrivere, poi si scrive tutto insieme. Letture e scritture alternate
     costringerebbero il browser a ricalcolare lo stile a ogni lettura, e sul telefono i fotogrammi salterebbero. */
  var inCoda = false;
  function giro() {
    inCoda = false;
    var vh = window.innerHeight;
    var sotto = window.scrollY > 8;
    var scritture = [];
    var leggi = function (nome, fn) { parte(nome, function () { var w = fn(); if (w) scritture.push([nome, w]); }); };
    if (apertura) leggi('apertura', apertura);
    if (cassetto) leggi('cassetto', function () { return cassetto(vh); });
    if (scena) leggi('scena', function () { return scena(vh); });
    racconti.forEach(function (r) { leggi('racconto', function () { return r(vh); }); });
    disegni.forEach(function (f) { leggi('disegni', function () { return f(vh); }); });
    risposte.forEach(function (f) { leggi('risposte', function () { return f(vh); }); });
    if (testata) testata.toggleAttribute('data-sotto', sotto);
    scritture.forEach(function (w) { parte(w[0], w[1]); });
  }
  function chiedi() { if (!inCoda) { inCoda = true; requestAnimationFrame(giro); } }
  window.addEventListener('scroll', chiedi, { passive: true });
  window.addEventListener('resize', chiedi);
  // Le sezioni più in basso cambiano altezza quando il browser le impagina (content-visibility): i disegni che seguono
  // lo scorrimento si rimettono al passo anche senza che la pagina scorra.
  if ('ResizeObserver' in window) new ResizeObserver(chiedi).observe(document.body);
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
    var ferma = function () { if (mq.matches) { fermi = true; document.querySelectorAll('video').forEach(function (v) { v.pause(); }); } };
    if (mq.addEventListener) mq.addEventListener('change', ferma);
  });
})();
