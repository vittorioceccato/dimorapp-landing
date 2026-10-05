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
})();
