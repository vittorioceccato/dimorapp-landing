// «Chi la usa» (ottavo giro, 11/11): le frasi di persone vere, fra la storia del quaderno e i prezzi.
//
// I testi li dà Vitto. Finché `voci` è vuoto la sezione NON si scrive nella pagina: non si vede e non lascia spazio.
// Qui non entra mai una frase inventata, nemmeno come segnaposto. Per vedere l'impaginazione c'è l'indirizzo con
// ?prova=1, che mostra frasi finte dichiarate tali (le scrive assets/landing.js, non questo file).
//
// Una voce: { frase: 'Le parole della persona, senza virgolette.', nome: 'Nome', chi: 'due case in affitto a Padova' }
// (`chi` si può lasciare fuori). Dopo aver cambiato questo file: node strumenti/genera-articoli.mjs
export const CHI_LA_USA = {
  titolo: 'Chi la usa',
  voci: [],
};
