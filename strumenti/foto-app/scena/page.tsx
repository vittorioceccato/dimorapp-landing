import Vista from './Vista'

// Pagina di prova SOLO nella copia temporanea dell'app (scratchpad): fotografie della veste nuova per la landing.
export default async function Pagina({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams
  return <Vista vista={vista ?? 'scadenze'} />
}
