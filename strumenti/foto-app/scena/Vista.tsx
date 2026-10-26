'use client'

// Fotografie per la landing, nella veste nuova (data-veste="nuova"), coi componenti veri e dati inventati.
import { useLayoutEffect, useState, useEffect } from 'react'
import DesktopSidebar from '@/app/(app)/DesktopSidebar'
import DaFotoFlow from '@/app/(app)/documenti/da-foto/DaFotoFlow'
import ScadenzeListClient from '@/app/(app)/scadenze/ScadenzeListClient'

const OGGI = '2026-10-20'
const CASA = { id: 'casa-tigli', user_id: 'u', nome: 'Casa di via dei Tigli', comune: 'Padova', indirizzo: 'Via dei Tigli 18', cap: '35121',
  destinazione: 'principale', color: '#2E6E4E', archived: false, has_mutuo: false, has_condominio: true, has_polizza: false, note: null,
  pertinenze: null, cin: null, cat_comune: null, cat_foglio: null, cat_particella: null, cat_subalterno: null, cat_categoria: null,
  cat_rendita: null, unita_condominiale: 'Int. 4', intestatari: [{ nominativo: 'Mario Rossi' }] }
const tigli = { nome: 'Casa di via dei Tigli', color: '#2E6E4E', comune: 'Padova' }
const mare = { nome: 'Casa al mare', color: '#3A7CA5', comune: 'Alassio' }
const bilo = { nome: 'Bilocale in affitto', color: '#B5651D', comune: 'Verona' }
const base = { user_id: 'u', direction: 'out', recurrence: 'none', status: 'pending', date_edited: false, note: null, silenziosa: false, source: 'manual', document_id: null }
const SCADENZE = [
  { ...base, id: 's1', property_id: 'casa-tigli', titolo: 'Bolletta luce', categoria: 'Utenze', due_date: '2026-10-26', amount: 96.48, source: 'document', document_id: 'd', properties: tigli },
  { ...base, id: 's2', property_id: 'bilo', titolo: 'Verifica incasso canone', categoria: 'Affitto', direction: 'in', recurrence: 'monthly', due_date: '2026-11-05', amount: 650, source: 'template', properties: bilo },
  { ...base, id: 's3', property_id: 'casa-tigli', titolo: 'Rata condominio 3/4', categoria: 'Condominio', due_date: '2026-12-01', amount: 312, source: 'document', document_id: 'd2', properties: tigli },
  { ...base, id: 's4', property_id: 'casa-tigli', titolo: 'TARI — seconda rata', categoria: 'Tasse', due_date: '2026-12-02', amount: 146, properties: tigli },
  { ...base, id: 's5', property_id: 'mare', titolo: 'IMU — saldo', categoria: 'IMU', due_date: '2026-12-16', amount: 828.67, source: 'template', properties: mare },
  { ...base, id: 's6', property_id: 'mare', titolo: 'Polizza casa — rinnovo', categoria: 'Assicurazioni', due_date: '2027-01-15', amount: 214, properties: mare },
].sort((a, b) => a.due_date.localeCompare(b.due_date))

const BOLLETTA = {
  tipo_documento: 'bolletta', titolo: 'Bolletta luce agosto-settembre 2026', fornitore: 'Casa Serena Luce',
  amount: 96.48, doc_date: '2026-10-02', due_date: '2026-10-26', periodo: '01/08/2026 - 30/09/2026', categoria: 'Utenze',
  property_hint: 'Via dei Tigli 18, Padova', indirizzo_immobile: null, locazione: null, soggiorno: null, cin: null,
  nota: 'Energia elettrica, periodo agosto-settembre 2026.', mutuo: null, catastale: null, catastale_unita: [], proprietari: [],
  dati_rilevanti: [], document_subtype: null, document_subtype_label: null, confidence: 'high', check_fields: [],
  model_used: 'claude-sonnet-5', escalated: false, condominio: null,
}

// Il contratto d'affitto letto (terzo giro della landing, 26/10): dati inventati, mai dati veri.
const BILOCALE = { ...CASA, id: 'bilocale', nome: 'Bilocale in affitto', comune: 'Verona', indirizzo: 'Via Mazzini 7', cap: '37121',
  destinazione: 'affitto', color: '#B5651D', has_condominio: false, unita_condominiale: null }
const LOCAZIONE = {
  sottotipo: '4+4', oggetto: 'intero', unita_indicate: [], conduttori: ['Giulia Conti'], decorrenza: '2023-07-01', durata_anni: 4,
  data_fine: '2027-06-30', canone_mensile: 650, cedolare_secca: true, conduttore: 'Giulia Conti', deposito: 1300, giorno_pagamento: 5,
  modalita_pagamento: 'bonifico', istat: false, spese_condominiali_a_carico: 'conduttore', spese_importo: null, spese_periodicita: null,
  spese_natura: null, spese_rapporto: null, registrazione_data: '2023-07-10', registrazione_estremi: null,
}
const CONTRATTO = {
  tipo_documento: 'contratto_locazione', titolo: 'Contratto di locazione 4+4 — Bilocale di via Mazzini', fornitore: null,
  amount: null, doc_date: '2023-06-20', due_date: null, periodo: null, categoria: 'Affitto',
  property_hint: 'Via Mazzini 7, Verona', indirizzo_immobile: null, locazione: LOCAZIONE,
  extra: { decorrenza: '2023-07-01', canone_mensile: 650, cedolare_secca: true }, soggiorno: null, cin: null,
  nota: 'Locazione abitativa 4+4, cedolare secca, deposito di due mensilità.', mutuo: null, catastale: null, catastale_unita: [],
  proprietari: [], dati_rilevanti: [], document_subtype: null, document_subtype_label: null, confidence: 'high', check_fields: [],
  model_used: 'claude-sonnet-5', escalated: false, condominio: null,
}

export default function Vista({ vista }: { vista: string }) {
  const [pronto, setPronto] = useState(false)
  useLayoutEffect(() => { document.documentElement.dataset.veste = 'nuova' }, [])
  useEffect(() => { setPronto(true) }, [])
  return (
    <div data-veste="nuova" data-pronto={pronto ? 'si' : undefined} className="min-h-screen bg-fondo">
      <style>{'nextjs-portal{display:none!important}'}</style>
      <div className="flex min-h-screen">
        <DesktopSidebar nome="Mario" hasAffitti amministratore={false} />
        <main className="flex-1 min-w-0">
          {(vista === 'scadenze' || vista === 'scadenze-prima') && (
            <div className="px-8 pt-7 pb-10 max-w-[820px]">
              <h1 className="font-titoli text-[26px] mb-4" style={{ color: 'var(--c-testo)' }}>Scadenze</h1>
              <ScadenzeListClient deadlines={(vista === 'scadenze-prima' ? SCADENZE.filter(x => x.id !== 's1') : SCADENZE) as never} in10str={OGGI} todayStr={OGGI} todayYear={2026} filterPropertyId={undefined} />
            </div>
          )}
          {vista === 'contratto' && (
            <div className="px-4 lg:px-8 pt-5 pb-28">
              <DaFotoFlow
                properties={[BILOCALE] as never}
                userName="Mario Rossi"
                resume={{ docId: 'doc-contratto', extraction: CONTRATTO as never, fileUrl: '/foto-landing-contratto.webp', fileMime: 'image/webp', fileName: 'Contratto di locazione.webp', lettura: null } as never}
              />
            </div>
          )}
          {vista === 'bolletta' && (
            <div className="px-4 lg:px-8 pt-5 pb-28">
              <DaFotoFlow
                properties={[CASA] as never}
                userName="Mario Rossi"
                resume={{ docId: 'doc-bolletta', extraction: BOLLETTA as never, fileUrl: '/foto-landing-bolletta.webp', fileMime: 'image/webp', fileName: 'Bolletta luce.webp', lettura: null } as never}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
