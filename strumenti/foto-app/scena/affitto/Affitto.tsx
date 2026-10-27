'use client'

import { useEffect, useLayoutEffect, useState, type ComponentProps } from 'react'
import DesktopSidebar from '@/app/(app)/DesktopSidebar'
import ContrattoSection from '@/app/(app)/immobili/[id]/ContrattoSection'
import MeseCanone from '@/app/(app)/immobili/[id]/MeseCanone'
import RegimeFiscaleSection from '@/app/(app)/immobili/[id]/RegimeFiscaleSection'
import SezioneRichiudibile from '@/components/SezioneRichiudibile'
import { TITOLO_BLOCCO, SCHEDA } from '@/lib/stili'
import * as T from '@/lib/scheda-casa-testi'

export default function Affitto({ d, carta, deposito }: {
  d: ComponentProps<typeof MeseCanone>['d']
  carta: ComponentProps<typeof ContrattoSection>['carta']
  deposito: string
}) {
  const [pronto, setPronto] = useState(false)
  useLayoutEffect(() => { document.documentElement.dataset.veste = 'nuova' }, [])
  useEffect(() => { setPronto(true) }, [])
  return (
    <div data-veste="nuova" data-pronto={pronto ? 'si' : undefined} className="min-h-screen bg-fondo">
      <style>{'nextjs-portal{display:none!important}'}</style>
      <div className="flex min-h-screen">
        <DesktopSidebar nome="Mario" hasAffitti amministratore={false} />
        <main className="flex-1 min-w-0">
          <div className="px-8 pt-7 pb-10 max-w-[760px]">
            <header className="mb-5">
              <p className="text-[13px]" style={{ color: 'var(--c-secondario)' }}>Verona · In affitto</p>
              <h1 className="font-titoli text-[26px]" style={{ color: 'var(--c-testo)' }}>Bilocale in affitto</h1>
            </header>
            <section className="mb-6" aria-labelledby="titolo-affitto">
              <h2 id="titolo-affitto" className={`${TITOLO_BLOCCO} mb-2.5`}>{T.AFFITTO}</h2>
              <div data-inquadra="carta-affitto" className={`${SCHEDA} px-4 py-4`}>
                <ContrattoSection
                  propertyId="bilocale"
                  locazioneId="loc-bilocale"
                  destinazione="affitto"
                  carta={carta}
                  data={{
                    inquilino: 'Giulia Conti', inquilino_email: null, contratto_tipo: '4+4', contratto_decorrenza: '2023-07-01',
                    contratto_scadenza: '2027-06-30', canone_mensile: 650, deposito: 1300, giorno_pagamento_canone: 5, incasso_automatico: false,
                    spese_importo: null, spese_periodicita: null, spese_natura: null, spese_rapporto: null,
                  }}
                />
                <div className="mt-4 pt-4 border-t border-[var(--c-riga)]"><MeseCanone d={d} /></div>
                <div className="mt-4 pt-4 border-t border-[var(--c-riga)]">
                  <RegimeFiscaleSection propertyId="bilocale" locazioneId="loc-bilocale" regime="cedolare" destinazione="affitto"
                    categoriaNonRes={null} locatoreIva={null} opzioneIva={null} canoneMensile={650} />
                </div>
                <SezioneRichiudibile variante="blocco" titolo={deposito}><div /></SezioneRichiudibile>
                <SezioneRichiudibile variante="blocco" titolo={T.DISDETTA_E_RINNOVO}><div /></SezioneRichiudibile>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
