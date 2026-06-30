import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTeamSearch } from '@/hooks/useTeamSearch'
import { Avatar } from '@/components/Avatar'
import { EmptyState, ErrorState } from '@/components/states'
import { clampTeamStats, goalDifference } from '@/utils/stats'
import type { Team } from '@/types/models'

/** Busca pública de times (PRD §7.7). Acessível a anônimos. */
export function SearchPage() {
  const [term, setTerm] = useState('')
  const { results, loading, error, searched, tooShort } = useTeamSearch(term)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">Buscar time</h1>

      <input
        type="search"
        placeholder="Digite o nome do time…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        autoFocus
        className="input"
        aria-label="Nome do time"
      />

      {tooShort && (
        <p className="text-center text-xs text-slate-400">Digite ao menos 2 letras para buscar.</p>
      )}

      {loading && <p className="text-center text-sm text-slate-400">Buscando…</p>}

      {error && <ErrorState error={error} />}

      {searched && !loading && results.length === 0 && (
        <EmptyState
          icon="🔍"
          title="Nenhum time encontrado"
          description="Confira a grafia ou tente outro nome. A busca é por início do nome."
        />
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((team) => (
            <li key={team.id}>
              <ResultCard team={team} />
            </li>
          ))}
        </ul>
      )}

      {!term && (
        <p className="px-1 text-center text-xs text-slate-400">
          Encontre qualquer time e veja a artilharia, o aproveitamento e as estatísticas — sem
          precisar de conta.
        </p>
      )}
    </div>
  )
}

function ResultCard({ team }: { team: Team }) {
  const s = clampTeamStats(team.stats)
  const diff = goalDifference(s)
  return (
    <Link to={`/time/${team.id}`} className="card flex items-center gap-3 hover:border-pitch-300">
      <Avatar src={team.logoURL || undefined} name={team.name} size={44} rounded="lg" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-bold text-slate-900">{team.name}</h2>
        <p className="text-xs text-slate-500">
          {s.played} {s.played === 1 ? 'jogo' : 'jogos'} · {s.wins}V {s.draws}E {s.losses}D · saldo{' '}
          {diff > 0 ? `+${diff}` : diff}
        </p>
      </div>
      <span className="text-slate-300" aria-hidden>
        ›
      </span>
    </Link>
  )
}
