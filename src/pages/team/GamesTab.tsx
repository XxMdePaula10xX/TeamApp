import { Link, useParams } from 'react-router-dom'
import { Placeholder } from '@/components/Placeholder'

/** Aba Jogos (PRD §7.4): lista cronológica + novo jogo + filtro. */
export function GamesTab() {
  const { teamId } = useParams()
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link to={`/time/${teamId}/jogo/novo`} className="btn-primary text-sm">
          + Novo jogo
        </Link>
      </div>
      <Placeholder title="Jogos" sprint="Sprint 1">
        <p className="text-sm text-slate-500">
          Lista cronológica de jogos com filtro por amistoso/campeonato.
        </p>
      </Placeholder>
    </div>
  )
}
