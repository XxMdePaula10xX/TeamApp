import { useState } from 'react'
import { Placeholder } from '@/components/Placeholder'
import { normalizeName } from '@/utils/normalize'

/** Busca pública de times (PRD §7.7). Acessível a anônimos. */
export function SearchPage() {
  const [term, setTerm] = useState('')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">Buscar time</h1>

      <input
        type="search"
        placeholder="Digite o nome do time…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pitch-500 focus:outline-none"
      />

      <Placeholder title="Resultados" sprint="Sprint 3">
        <p className="text-sm text-slate-500">
          A consulta usará{' '}
          <code className="rounded bg-slate-100 px-1">
            where('normalizedName', '&gt;=', termo)
          </code>{' '}
          sobre o termo normalizado.
          {term && (
            <>
              {' '}
              Termo normalizado:{' '}
              <code className="rounded bg-slate-100 px-1">{normalizeName(term) || '∅'}</code>
            </>
          )}
        </p>
      </Placeholder>
    </div>
  )
}
