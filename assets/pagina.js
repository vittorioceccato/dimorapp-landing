/* Dimora — landing. Uno script solo, nessuna dipendenza, nessuna chiamata a terzi
   tranne la lista d'attesa. Ogni parte si accende da sé: se una fallisce, le altre
   restano, e senza script la pagina si legge tutta. */
(function () {
  'use strict';

  var body = document.body;

  /* ---------- Le statistiche (Vercel Web Analytics) ----------
     Lo script /_vercel/insights/script.js è servito dal sito stesso e legge la coda window.vaq
     preparata nella testa della pagina. Qui si fanno due cose, e nessuna può far fallire la pagina:
     1. Prima dell'invio ogni indirizzo si ripulisce (beforeSend, il modo documentato da Vercel
        per l'HTML semplice): via il frammento dopo il cancelletto e tutti i parametri, tranne
        i cinque delle campagne; anche questi si scartano se contengono una chiocciola o sono
        più lunghi di 100 caratteri. Se l'indirizzo non si legge, l'invio non parte.
     2. Gli eventi: nomi stabili e minuscoli, una sola proprietà, «posizione». Mai dati della
        persona: né la mail né testi scritti dal visitatore. I pulsanti si riconoscono dagli
        attributi data-evento e data-posizione, mai dall'indirizzo a cui portano.
     Se lo script è bloccato, window.va resta la coda della testa (o non c'è): non succede niente. */
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
    try {
      if (typeof window.va === 'function') window.va.apply(window, arguments);
    } catch (e) { /* le statistiche non fermano mai la pagina */ }
  }

  function evento(nome, posizione) {
    statistica('event', { name: nome, data: { posizione: posizione || '' } });
  }

  statistica('beforeSend', function (e) {
    try {
      var copia = {};
      for (var k in e) if (Object.prototype.hasOwnProperty.call(e, k)) copia[k] = e[k];
      copia.url = indirizzoPulito(e.url);
      return copia;
    } catch (x) {
      return null;
    }
  });

  // Un clic, un evento: un ascoltatore solo, sull'elemento con data-evento più vicino.
  document.addEventListener('click', function (e) {
    try {
      var el = e.target && e.target.closest ? e.target.closest('[data-evento]') : null;
      if (el) evento(el.getAttribute('data-evento'), el.getAttribute('data-posizione'));
    } catch (x) { /* niente */ }
  });

  /* ---------- Il menu del telefono ----------
     È un <details>: si apre e si chiude anche senza script e da tastiera (Invio, Spazio).
     Qui si aggiunge solo che si chiude scegliendo una voce, con Esc o toccando fuori. */
  (function menu() {
    var m = document.querySelector('[data-menu]');
    if (!m) return;
    var bottone = m.querySelector('summary');
    m.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (a) m.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (m.open && (e.key === 'Escape' || e.key === 'Esc')) {
        m.open = false;
        bottone.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (m.open && !m.contains(e.target)) m.open = false;
    });
  })();

  /* ---------- L'interruttore dei prezzi ----------
     Due bottoni, «Annuale» e «Mensile»: aria-pressed dice quale è scelto. Si sceglie qui
     scrivendo data-periodo ("anno" o "mese") sulla sezione, e il CSS mostra il prezzo giusto.
     Senza script data-periodo non c'è: niente interruttore, i due prezzi insieme.
     All'apertura è scelto l'annuale. La scelta non si salva da nessuna parte. */
  (function prezzi() {
    var sezione = document.querySelector('[data-prezzi]');
    if (!sezione) return;
    var bottoni = [].slice.call(sezione.querySelectorAll('[data-periodo-scelta]'));
    if (bottoni.length !== 2) return;
    function scegli(periodo) {
      bottoni.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-periodo-scelta') === periodo ? 'true' : 'false');
      });
      sezione.setAttribute('data-periodo', periodo);
    }
    bottoni.forEach(function (b) {
      b.addEventListener('click', function () { scegli(b.getAttribute('data-periodo-scelta')); });
    });
    scegli('anno');
  })();

  /* ---------- I moduli della lista d'attesa ----------
     Quattro moduli, una regola sola. Scrivono nella tabella waitlist di Supabase
     con la chiave pubblica (la stessa della pagina di prima), source 'landing'.
     201 (iscritto) e 409 (già in lista) danno LO STESSO messaggio: dalla pagina
     non si capisce se un indirizzo c'era già. Il campo nascosto «company» è
     l'esca per i programmi automatici: se è pieno non si invia niente e si
     risponde come se fosse andata bene. */
  (function moduli() {
    var INDIRIZZO = 'https://lgmqdcozhmaimkqnhpqb.supabase.co/rest/v1/waitlist';
    var CHIAVE = 'sb_publishable_uXnC9Hvh1PpLGuZ93t-xhg_8iF3-bN7';
    var MAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    var TEMPO_MASSIMO_MS = 15000;
    var TESTI = {
      fatto: 'Grazie! Ti avvisiamo all\'apertura.',
      mail: 'Controlla la mail e riprova.',
      errore: 'Qualcosa è andato storto. Riprova tra poco.',
      invio: 'Invio…'
    };

    var forms = [].slice.call(document.querySelectorAll('form[data-wl]'));
    if (!forms.length || !window.fetch) return;

    forms.forEach(function (f) {
      var campo = f.querySelector('input[type="email"]');
      var esca = f.querySelector('input[name="company"]');
      var bottone = f.querySelector('button[type="submit"]');
      var blocco = f.parentNode;
      var esito = blocco ? blocco.querySelector('[data-wl-esito]') : null;
      var inCorso = false;
      if (!campo || !bottone) return;
      campo.disabled = false;

      function mostra(testo, bene) {
        if (!esito) return;
        esito.textContent = testo;
        esito.className = 'esito ' + (bene ? 'esito-ok' : 'esito-errore');
      }

      campo.addEventListener('input', function () { campo.removeAttribute('aria-invalid'); });

      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (inCorso) return;
        var mail = (campo.value || '').trim();
        if (esca && (esca.value || '').trim()) {
          mostra(TESTI.fatto, true);
          f.reset();
          return;
        }
        if (!MAIL.test(mail) || mail.length > 254) {
          campo.setAttribute('aria-invalid', 'true');
          mostra(TESTI.mail, false);
          campo.focus();
          return;
        }
        campo.removeAttribute('aria-invalid');
        inCorso = true;
        var etichetta = bottone.textContent;
        bottone.disabled = true;
        bottone.setAttribute('aria-busy', 'true');
        bottone.textContent = TESTI.invio;
        if (esito) { esito.textContent = ''; esito.className = 'esito'; }

        var stop = window.AbortController ? new AbortController() : null;
        var timer = setTimeout(function () { if (stop) stop.abort(); }, TEMPO_MASSIMO_MS);
        fetch(INDIRIZZO, {
          method: 'POST',
          headers: {
            'apikey': CHIAVE,
            'Authorization': 'Bearer ' + CHIAVE,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ email: mail, source: 'landing' }),
          signal: stop ? stop.signal : undefined
        })
          .then(function (r) {
            if (r.status === 201 || r.status === 409) {
              mostra(TESTI.fatto, true);
              f.reset();
              // Solo per le statistiche le due risposte restano distinte; a schermo sono identiche.
              evento(r.status === 201 ? 'lista_iscritto' : 'lista_gia_iscritto', f.getAttribute('data-posizione'));
            } else {
              mostra(TESTI.errore, false);
            }
          })
          .catch(function () { mostra(TESTI.errore, false); })
          .then(function () {
            clearTimeout(timer);
            inCorso = false;
            bottone.disabled = false;
            bottone.removeAttribute('aria-busy');
            bottone.textContent = etichetta;
          });
      });
    });

    body.setAttribute('data-moduli', 'attivi');
  })();

  /* ---------- Il lancio: la data, il conto alla rovescia, lo stato ----------
     Due valori, scritti una volta sola sul <body> di index.html:
       data-lancio  la data e l'ora del lancio, con il fuso (AAAA-MM-GGThh:mm:ss+02:00);
       data-stato   "in arrivo" oppure "aperta" (esattamente così: lo legge anche il CSS).
     Da qui lo script ricava l'aspetto della pagina e lo scrive in data-aspetto:
       prima   in arrivo, prima della data: conto alla rovescia e frasi con la data;
       dopo    in arrivo, dalla data in poi: niente timer né date, «Ci siamo quasi»,
               i moduli restano. La pagina non dice mai da sola che la beta è aperta;
       aperta  la beta è aperta: niente timer né moduli, «Inizia la prova gratuita».
     Giorno e ora si scrivono sempre in italiano e nell'ora italiana (Europe/Rome),
     qualunque siano la lingua e il fuso del dispositivo. */
  (function lancio() {
    var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
      'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    var scritto = (body.getAttribute('data-lancio') || '').trim();
    var lancioMs = Date.parse(scritto);
    if (isNaN(lancioMs)) return; // data scritta male: la pagina resta com'è senza script

    function due(n) { return (n < 10 ? '0' : '') + n; }

    // Le parti della data viste da Roma. Si chiede a Intl il solo calendario in cifre
    // (en-US dà sempre cifre latine): i nomi di giorni e mesi sono nostri, in italiano.
    function partiRoma(ms) {
      var f = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      });
      var p = {};
      f.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      return { a: +p.year, m: +p.month, g: +p.day, h: (+p.hour) % 24, mi: +p.minute };
    }
    // Ripiego per un browser senza fusi orari: l'ora come è scritta in data-lancio,
    // che va scritta con il fuso italiano (+02:00 d'estate, +01:00 d'inverno).
    function partiScritte(t) {
      var r = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(t);
      return r ? { a: +r[1], m: +r[2], g: +r[3], h: +r[4], mi: +r[5] } : null;
    }
    function dataItaliana(ms) {
      var p = null;
      try { p = partiRoma(ms); } catch (e) { p = null; }
      if (!p || isNaN(p.a + p.m + p.g + p.h + p.mi)) p = partiScritte(scritto);
      if (!p) return '';
      var settimana = new Date(Date.UTC(p.a, p.m - 1, p.g)).getUTCDay();
      // Spazi non divisibili fra giorno e mese e fra «alle» e l'ora: non vanno a capo a metà.
      var ora = (p.h === 1 ? 'all\'' : 'alle ') + p.h + ':' + due(p.mi);
      return GIORNI[settimana] + ' ' + p.g + ' ' + MESI[p.m - 1] + ' ' + ora;
    }

    var quando = dataItaliana(lancioMs);
    if (!quando) return;
    [].forEach.call(document.querySelectorAll('[data-quando]'), function (el) { el.textContent = quando; });

    var cifre = {};
    ['g', 'h', 'm', 's'].forEach(function (k) { cifre[k] = document.querySelector('[data-cd="' + k + '"]'); });

    function scriviCifre(restanoMs) {
      var s = Math.max(0, Math.floor(restanoMs / 1000));
      var v = { g: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      Object.keys(v).forEach(function (k) {
        var el = cifre[k];
        if (!el || el.textContent === due(v[k])) return;
        el.textContent = due(v[k]);
        el.classList.remove('scatta');
        void el.offsetWidth; // fa ripartire l'animazione della cifra
        el.classList.add('scatta');
      });
    }

    function aggiorna() {
      var ora = Date.now();
      var aspetto = body.getAttribute('data-stato') === 'aperta' ? 'aperta'
        : (ora < lancioMs ? 'prima' : 'dopo');
      if (aspetto === 'prima') scriviCifre(lancioMs - ora);
      if (body.getAttribute('data-aspetto') !== aspetto) body.setAttribute('data-aspetto', aspetto);
    }

    aggiorna();
    (function giro() {
      setTimeout(function () { aggiorna(); giro(); }, 1000 - (Date.now() % 1000) + 20);
    })();
  })();

  /* ---------- La lente sulle schermate dell'apertura ----------
     Le due schermate sono collegamenti al loro file: senza script (o senza <dialog>) si apre il file.
     Con lo script si aprono nella finestra della lente, adattate allo schermo; «Dimensione reale» (o un tocco
     sull'immagine) le mostra alla grandezza a cui sono state acquisite, da esplorare scorrendo.
     Si chiude con «Chiudi», con Esc o toccando fuori; il fuoco torna alla schermata da cui si è partiti.
     Ogni apertura mette nella finestra un'immagine nuova. L'evento «close» arriva dopo la chiusura, in un compito
     a parte: se nel frattempo la lente è stata riaperta non si pulisce niente. Prima la pulizia toglieva l'indirizzo
     all'immagine anche quando arrivava dopo la riapertura, e la lente riaperta mostrava solo il testo alternativo. */
  (function lente() {
    var finestra = document.querySelector('[data-lente-finestra]');
    var aperture = [].slice.call(document.querySelectorAll('a[data-lente]'));
    if (!finestra || !aperture.length || typeof finestra.showModal !== 'function') return;
    var titolo = finestra.querySelector('.lente-titolo');
    var area = finestra.querySelector('[data-lente-area]');
    var modo = finestra.querySelector('[data-lente-modo]');
    var chiudi = finestra.querySelector('[data-lente-chiudi]');
    if (!titolo || !area || !modo || !chiudi) return;
    var img = null;
    var reale = false, larghezza = 0, partenza = null;

    function nuovaImmagine(indirizzo, testo) {
      var nuova = document.createElement('img');
      nuova.decoding = 'async';
      nuova.alt = testo;
      nuova.addEventListener('load', serveIlModo);
      nuova.addEventListener('click', function () { if (!modo.hidden) { reale = !reale; mostra(); } });
      nuova.src = indirizzo;
      while (area.firstChild) area.removeChild(area.firstChild);
      area.appendChild(nuova);
      img = nuova;
    }
    // Adattata, la schermata non supera la sua grandezza reale; se adattata è già quasi reale, il pulsante non serve.
    function serveIlModo() {
      if (!img || reale || !larghezza || !img.complete) return;
      modo.hidden = img.getBoundingClientRect().width >= larghezza * 0.9;
      area.classList.toggle('lente-senza-modo', modo.hidden);
    }
    function mostra() {
      area.classList.toggle('lente-reale', reale);
      if (img) {
        img.style.width = reale && larghezza ? larghezza + 'px' : '';
        img.style.maxWidth = !reale && larghezza ? 'min(100%, ' + larghezza + 'px)' : '';
      }
      modo.setAttribute('aria-pressed', reale ? 'true' : 'false');
      modo.textContent = reale ? 'Adatta allo schermo' : 'Dimensione reale';
      area.scrollTop = 0;
      area.scrollLeft = 0;
    }
    function apri(a) {
      var interna = a.querySelector('img');
      var testo = interna ? interna.alt : '';
      partenza = a;
      larghezza = parseInt(a.getAttribute('data-larghezza'), 10) || 0;
      nuovaImmagine(a.getAttribute('href'), testo);
      titolo.textContent = testo;
      reale = false;
      modo.hidden = false;
      mostra();
      document.documentElement.classList.add('lente-aperta');
      if (!finestra.open) finestra.showModal();
      chiudi.focus();
      serveIlModo();
    }
    window.addEventListener('resize', function () { if (finestra.open) serveIlModo(); });

    aperture.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // nuova scheda: il file
        e.preventDefault();
        apri(a);
      });
    });
    modo.addEventListener('click', function () { reale = !reale; mostra(); });
    chiudi.addEventListener('click', function () { finestra.close(); });
    // Un tocco fuori dal riquadro della finestra (sullo sfondo) la chiude.
    finestra.addEventListener('click', function (e) {
      if (e.target !== finestra) return;
      var r = finestra.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) finestra.close();
    });
    finestra.addEventListener('close', function () {
      if (finestra.open) return; // riaperta prima che arrivasse questo evento: l'immagine è quella nuova
      document.documentElement.classList.remove('lente-aperta');
      while (area.firstChild) area.removeChild(area.firstChild);
      img = null;
      if (partenza) partenza.focus();
    });
  })();

  /* ---------- La barra che segue (fino a 1200 px, lo decide il CSS) ----------
     Quando la testata esce dallo schermo, data-barra="fissa" sull'<html>: la barra si ferma in alto, più bassa.
     La testata tiene il suo spazio, quindi la pagina non salta. Mentre un campo della pagina ha il fuoco,
     data-scrivendo: su un telefono la barra si toglie e non finisce sopra il campo con la tastiera aperta. */
  (function barra() {
    var html = document.documentElement;
    var testata = document.querySelector('.testata');
    if (testata && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (voci) {
        var fuori = !voci[voci.length - 1].isIntersecting;
        if (fuori) html.setAttribute('data-barra', 'fissa'); else html.removeAttribute('data-barra');
      }).observe(testata);
    }
    document.addEventListener('focusin', function (e) {
      if (e.target && e.target.matches && e.target.matches('input, textarea')) html.setAttribute('data-scrivendo', '');
    });
    document.addEventListener('focusout', function () { html.removeAttribute('data-scrivendo'); });
  })();

  /* ---------- Le righe che scorrono (fino a 640 px, lo decide il CSS) ----------
     Sotto ogni riga [data-scorre] i puntini, uno per scheda, che dicono a che punto sei (solo disegnati).
     Quando la riga scorre davvero diventa raggiungibile da tastiera (le frecce la fanno scorrere) e, per un lettore
     di schermo, una regione con il nome del titolo della sua sezione (data-scorre ne porta l'id). */
  (function righe() {
    var righe = [].slice.call(document.querySelectorAll('[data-scorre]'));
    if (!righe.length) return;
    var tutte = righe.map(function (riga) {
      var schede = [].slice.call(riga.children);
      var puntini = document.createElement('div');
      puntini.className = 'puntini';
      puntini.setAttribute('aria-hidden', 'true');
      schede.forEach(function () { puntini.appendChild(document.createElement('span')); });
      riga.parentNode.insertBefore(puntini, riga.nextSibling);
      var attivo = -1, inAttesa = false;
      function aggiorna() {
        inAttesa = false;
        var x = riga.scrollLeft, fine = riga.scrollWidth - riga.clientWidth;
        var bordo = parseFloat(window.getComputedStyle(riga).paddingLeft) || 0;
        var scelto = 0;
        if (fine > 1 && x >= fine - 2) scelto = schede.length - 1;
        else {
          var meglio = Infinity;
          schede.forEach(function (s, i) { var d = Math.abs(s.offsetLeft - bordo - x); if (d < meglio) { meglio = d; scelto = i; } });
        }
        if (scelto === attivo) return;
        attivo = scelto;
        [].forEach.call(puntini.children, function (p, i) { if (i === scelto) p.setAttribute('data-attivo', ''); else p.removeAttribute('data-attivo'); });
      }
      riga.addEventListener('scroll', function () {
        if (!inAttesa) { inAttesa = true; window.requestAnimationFrame(aggiorna); }
      }, { passive: true });
      aggiorna();
      return { riga: riga, aggiorna: aggiorna };
    });
    function accessibili() {
      tutte.forEach(function (t) {
        var r = t.riga;
        if (r.scrollWidth > r.clientWidth + 1) {
          r.setAttribute('tabindex', '0');
          r.setAttribute('role', 'region');
          r.setAttribute('aria-labelledby', r.getAttribute('data-scorre'));
        } else {
          r.removeAttribute('tabindex');
          r.removeAttribute('role');
          r.removeAttribute('aria-labelledby');
        }
        t.aggiorna();
      });
    }
    accessibili();
    var timer = null;
    window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(accessibili, 150); });
    window.addEventListener('load', accessibili);
  })();

  /* ---------- La lettera sul telefono ----------
     Fino a 640 px (lo decide il CSS) si leggono la domanda e il primo paragrafo; il resto si apre con
     «Continua a leggere», una volta sola, e il fuoco va al testo che si è aperto. Senza script si legge tutta. */
  (function lettera() {
    var scheda = document.querySelector('[data-storia]');
    var apri = scheda ? scheda.querySelector('[data-storia-apri]') : null;
    var resto = document.getElementById('storia-resto');
    if (!apri || !resto) return;
    scheda.setAttribute('data-chiusa', '');
    apri.addEventListener('click', function () {
      apri.setAttribute('aria-expanded', 'true');
      scheda.removeAttribute('data-chiusa');
      resto.focus();
    });
  })();

  /* ---------- Le comparse allo scorrimento ----------
     Sezioni e schede compaiono quando entrano nello schermo, in sequenza nelle griglie
     ([data-rv] un elemento, [data-rv-gruppo] i suoi figli uno dopo l'altro).
     Con «riduci movimento» non si nasconde niente; senza IntersectionObserver neppure. */
  (function comparse() {
    var riduci = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (riduci || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js');

    var elementi = [].slice.call(document.querySelectorAll('[data-rv]'));
    [].forEach.call(document.querySelectorAll('[data-rv-gruppo]'), function (g) {
      [].forEach.call(g.children, function (k, i) {
        k.style.transitionDelay = (i % 4 * 90) + 'ms';
        elementi.push(k);
      });
    });

    function mostra(e) {
      e.classList.add('in');
      setTimeout(function () { e.style.transitionDelay = ''; e.classList.add('fatto'); }, 1300);
    }
    var osservatore = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { mostra(v.target); osservatore.unobserve(v.target); }
      });
    }, { threshold: 0.05 });
    elementi.forEach(function (e) { e.classList.add('rv'); osservatore.observe(e); });

    // In stampa, tutto visibile.
    window.addEventListener('beforeprint', function () { elementi.forEach(function (e) { e.classList.add('in', 'fatto'); }); });
  })();
})();
