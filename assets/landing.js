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
      disegni.push(function (vh, scarto) {
        var b = (scena || d).getBoundingClientRect();
        if (b.bottom < -vh || b.top > vh * 2) return;
        var r = { top: b.top + scarto, height: b.height };
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
       0,66-0,92 escono i tre cartellini, ognuno dalla sua riga (il canone dal contratto, la rendita e la scadenza
                 dalla visura: la scadenza è l'IMU), e si posano a fianco della cartella, legati da una linea sottile;
                 l'ultimo (la scadenza, col punto ambra) per ultimo.
     Le carte: la bolletta e la foto nella casa al mare, il rogito nel box, il resto in via Roma (sesto giro, 27/10).
     I testi: il primo fino a 0,18, il secondo da 0,23 a 0,65, il terzo da 0,65. Si scrivono solo trasformazioni e
     opacità: l'impaginazione non si muove. Risalendo, gli stessi conti all'indietro. p segue lo scorrimento con un
     piccolo ritardo morbido (vedi il giro per fotogramma, in fondo). */
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
    // Ogni cartellino ha la sua riga (data-a): esce da lì e una linea sottile ce lo lega.
    var cartellini = Array.prototype.slice.call(sezione.querySelectorAll('[data-cartellino]')).map(function (el) {
      return { el: el, riga: aperto.querySelector('[data-lega="' + el.getAttribute('data-a') + '"]') };
    });
    var linee = Array.prototype.slice.call(sezione.querySelectorAll('[data-linea]'));
    var tela = sezione.querySelector('[data-linee]');
    // Le curve (sesto giro, 27/10): le carte partono piano e arrivano rallentando, i cartellini si posano rallentando.
    var morbido = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var rallenta = function (t) { return 1 - Math.pow(1 - t, 3); };
    var parte_ = function (t) { return t * t * (3 - 2 * t); };
    var tra = function (p, a, b) { return limita((p - a) / (b - a)); };
    var prima = -1, primaL = -1, primaA = -1, primaD = '', firmaMisure = '', misurePrima = null;
    sezione.setAttribute('data-segue', '');
    cassetto = function (vh, scarto) {
      var r = sezione.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var corsa = r.height - fermo.offsetHeight;
      var p = Math.round(limita((64 - r.top - scarto) / (corsa > 0 ? corsa : 1)) * 1000) / 1000;
      var L = palco.clientWidth, A = palco.clientHeight;
      if (p === prima && L === primaL && A === primaA) return;
      prima = p; primaL = L; primaA = A;
      // Letture prima delle scritture: le misure di riposo (offset) non dipendono dalle trasformazioni. Si rifanno solo
      // quando cambia qualcosa che le muove (il palco, la cartella aperta, i cartellini): a ogni fotogramma si usa quelle.
      var firma = L + 'x' + A + ':' + aperto.offsetTop + ':' + aperto.offsetHeight + ':' + cartellini.map(function (t) { return t.el.offsetTop + '/' + t.el.offsetWidth; }).join(',');
      var misure = firma === firmaMisure ? misurePrima : null;
      if (!misure) {
        var cw = carte[0].el.offsetWidth, ch = carte[0].el.offsetHeight;
        var P = { x: aperto.offsetLeft, y: aperto.offsetTop, w: aperto.offsetWidth, h: aperto.offsetHeight };
        var telefono = L < 660; // il palco stretto: i cartellini sotto (lo stesso confine del foglio di stile)
        misure = {
          telefono: telefono,
          dove: carte.map(function (c) { return { x: c.dove.offsetLeft + c.dove.offsetWidth / 2 - cw / 2, y: c.dove.offsetTop + c.dove.offsetHeight * 0.45 - ch / 2 }; }),
          R: { x: roma.offsetLeft, y: roma.offsetTop, w: roma.offsetWidth, h: roma.offsetHeight },
          P: P,
          // Dove sta la riga di ogni cartellino a cartella aperta, e dove si posa il cartellino.
          lega: cartellini.map(function (t) {
            // La riga dentro la cartella aperta: le misure si sommano fino a lei (i gruppi, che si muovono, fanno da
            // riferimento alle loro righe).
            var g = t.riga, gx = 0, gy = 0;
            for (var e = g; e && e !== aperto; e = e.offsetParent) { gx += e.offsetLeft; gy += e.offsetTop; }
            return {
              riga: { x: P.x + gx, y: P.y + gy, w: g.offsetWidth, h: g.offsetHeight },
              t: { x: t.el.offsetLeft, y: t.el.offsetTop, w: t.el.offsetWidth, h: t.el.offsetHeight },
            };
          }),
        };
        firmaMisure = firma; misurePrima = misure;
        misure.telefono = telefono;
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
        prima = -1;
        return function () {
          aperto.style.top = riposo.su === '' ? '' : riposo.su + 'px';
          cartellini.forEach(function (t, j) { t.el.style.top = riposo.tops[j] === '' ? '' : riposo.tops[j] + 'px'; });
          chiedi();
        };
      }
      var m = misure, tutteD = m.d.join('|') + '|' + L + 'x' + A, cambiaD = tutteD !== primaD;
      primaD = tutteD;
      return function () {
      if (cambiaD && tela) {
        tela.setAttribute('viewBox', '0 0 ' + L + ' ' + A);
        linee.forEach(function (l, j) { if (m.d[j]) l.setAttribute('d', m.d[j]); });
      }
      // Le carte: volano nella loro cartella con una leggera rotazione, che si raddrizza quando entrano. Ogni cartella
      // si gonfia un attimo quando una carta ci entra.
      var gonfia = new Map();
      carte.forEach(function (c, i) {
        var a = 0.10 + i * 0.035, b = 0.27 + i * 0.035;
        var t = tra(p, a, b), k = rallenta(parte_(t));
        var x = c.x * L + (m.dove[i].x - c.x * L) * k;
        var y = c.y * A + (m.dove[i].y - c.y * A) * k;
        var s = 1 - 0.78 * k;
        var giro = c.r * (1 - k) + (c.r >= 0 ? -1 : 1) * 7 * Math.sin(Math.PI * k);
        c.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + giro.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
        c.el.style.opacity = String(limita((1 - k) * 6));
        var entra = Math.sin(Math.PI * tra(p, b - 0.02, b + 0.035));
        gonfia.set(c.dove, Math.max(gonfia.get(c.dove) || 0, entra));
      });
      // Le cartelle: compaiono, poi lasciano il posto alla cartella aperta.
      var compare = morbido(tra(p, 0.05, 0.12));
      var apre = morbido(tra(p, 0.42, 0.54));
      cartelle.forEach(function (el) {
        var via = el === roma ? limita(apre * 4) : apre;
        var g = 1 + 0.07 * (gonfia.get(el) || 0);
        el.style.opacity = String(compare * (1 - via));
        el.style.transform = 'translateY(' + ((1 - compare) * 24 + (el === roma ? 0 : via * 18)).toFixed(1) + 'px) scale(' + g.toFixed(3) + ')';
      });
      // La cartella di via Roma che si apre.
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
        var k = rallenta(tra(p, 0.66 + j * 0.08, 0.78 + j * 0.08));
        var l = m.lega[j], dx = l.riga.x + l.riga.w * 0.5 - (l.t.x + l.t.w / 2), dy = l.riga.y + l.riga.h / 2 - (l.t.y + l.t.h / 2);
        t.el.style.opacity = String(limita(k * 3));
        t.el.style.transform = 'translate(' + (dx * (1 - k)).toFixed(1) + 'px,' + (dy * (1 - k)).toFixed(1) + 'px) scale(' + (0.5 + 0.5 * k).toFixed(3) + ')';
        if (linee[j]) linee[j].style.opacity = String(limita((k - 0.55) / 0.45));
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
    scena = function (vh, scarto) {
      var r = el.getBoundingClientRect();
      var inizio = vh * 0.92, fine = vh * 0.42 - r.height / 2;
      var p = limita((inizio - r.top - scarto) / (inizio - fine));
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
    apertura = function (y) {
      var h = sezione.offsetHeight || 1;
      var v = limita(y / h).toFixed(3);
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
      risposte.push(function (vh, scarto) {
        var r = riga.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        // Entra fra il 95% e il 75% dello schermo.
        var o = Math.round(limita((vh * 0.95 - r.top - scarto) / (vh * 0.2)) * 1000) / 1000;
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
    if (apertura) leggi('apertura', function () { return apertura(lisciato); });
    if (cassetto) leggi('cassetto', function () { return cassetto(vh, scarto); });
    if (scena) leggi('scena', function () { return scena(vh, scarto); });
    racconti.forEach(function (r) { leggi('racconto', function () { return r(vh); }); });
    disegni.forEach(function (f) { leggi('disegni', function () { return f(vh, scarto); }); });
    risposte.forEach(function (f) { leggi('risposte', function () { return f(vh, scarto); }); });
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
