/* Dimora — landing. Uno script solo, nessuna dipendenza, nessuna chiamata a terzi
   tranne la lista d'attesa. Ogni parte si accende da sé: se una fallisce, le altre
   restano, e senza script la pagina si legge tutta. */
(function () {
  'use strict';

  var body = document.body;

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
})();
