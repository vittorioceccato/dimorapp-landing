import Affitto from './Affitto'
import { statoRataCanone } from '@/lib/incasso'
import { statoMeseInParole, comandoDelMese, nomeMese, rigaStatoContratto, rigaDeposito } from '@/lib/scheda-casa'
import * as T from '@/lib/scheda-casa-testi'
import { locazioneLabel } from '@/lib/locazione'

// Pagina di prova SOLO nella copia temporanea dell'app: la carta dell'affitto della scheda (0.9.44), dati inventati,
// righe composte con le funzioni vere della pagina dell'immobile.
const OGGI = '2026-10-03'

// ?stato=da_incassare | parziale (per il minivideo dei canoni, 27/10); senza, la rata di ottobre incassata.
export default async function Pagina({ searchParams }: { searchParams: Promise<{ stato?: string }> }) {
  const { stato: scelta } = await searchParams
  const daIncassare = scelta === 'da_incassare', parziale = scelta === 'parziale'
  const r = {
    id: 'rata-ottobre', due_date: '2026-10-05', amount: 650,
    amount_incassato: daIncassare ? null : parziale ? 400 : 650, data_incasso: daIncassare ? null : '2026-10-04',
    status: daIncassare || parziale ? 'pending' : 'done', importo_da_confermare: false, override_mora: false, note: null,
  }
  const { stato: s, giorniMora } = statoRataCanone(r, false, OGGI)
  const d = {
    riga: T.meseEntroIl(nomeMese(r.due_date), r.amount, 5),
    stato: statoMeseInParole(s, r, giorniMora),
    inRitardo: s === 'in_mora',
    comando: comandoDelMese(s, r),
    rata: { id: r.id, amount: r.amount, amount_incassato: r.amount_incassato, nota: null },
    mese: '2026-10',
    mesiDaVerificare: 0,
  }
  const carta = [
    { testo: 'Giulia Conti', forte: true },
    { testo: T.canoneAlMese(650) },
    { testo: `${T.dalAl('2023-07-01', '2027-06-30')} · ${locazioneLabel('4+4')}` },
  ]
  const stato = rigaStatoContratto({ scadenza: '2027-06-30', disdetta: null, tipo: '4+4' }, OGGI)
  if (stato) carta.push({ testo: stato })
  const deposito = rigaDeposito({ deposito: 1300, restituito: null, trattenuto: null, data: null }) ?? ''
  return <Affitto d={d} carta={carta} deposito={deposito} />
}
