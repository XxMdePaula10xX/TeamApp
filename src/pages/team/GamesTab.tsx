import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTeamOutlet } from '@/hooks/useTeamOutlet'
import { useGames } from '@/hooks/useGames'
import { usePlayers } from '@/hooks/usePlayers'
import { useCompetitions } from '@/hooks/useCompetitions'
import { deleteGame } from '@/services/games'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { formatDate } from '@/utils/dates'
import { countAttributedGoals } from '@/utils/stats'
import type { Game, GameType } from '@/types/models'

type Filter = GameType | 'TODOS'

/** Aba Jogos (PRD §7.4). */
export function GamesTab() {
  const { team, isOwner } = useTeamOutlet()
  const [filter, setFilter] = useState<Filter>('TODOS')
  const { games, loading, error } = useGames(team.id, filter === 'TODOS' ? null : filter)
  const { players } = usePlayers(team.id)
  const { competitions } = useCompetitions(team.id)

  const compName = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of competitions ?? []) map.set(c.id, c.name)
    return map
  }, [competitions])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
          <FilterBtn label="Todos" active={filter === 'TODOS'} onClick={() => setFilter('TODOS')} />
          <FilterBtn label="Amistosos" active={filter === 'AMISTOSO'} onClick={() => setFilter('AMISTOSO')} />
          <FilterBtn label="Campeonato" active={filter === 'CAMPEONATO'} onClick={() => setFilter('CAMPEONATO')} />
        </div>
        {isOwner && (
          <Link to={`/time/${team.id}/jogo/novo`} className="btn-primary shrink-0 text-sm">
            + Novo jogo
          </Link>
        )}
      </div>

      {loading && <Loading />}
      {error && <ErrorState error={error} />}
      {games && games.length === 0 && (
        <EmptyState
          icon="📅"
          title={filter === 'TODOS' ? 'Nenhum jogo ainda' : 'Nenhum jogo neste filtro'}
          description={
            isOwner && filter === 'TODOS'
              ? 'Cadastre o primeiro jogo para começar a contabilizar gols, assistências e aproveitamento.'
              : undefined
          }
          action={
            isOwner && filter === 'TODOS' ? (
              <Link to={`/time/${team.id}/jogo/novo`} className="btn-primary text-sm">
                + Novo jogo
              </Link>
            ) : undefined
          }
        />
      )}

      {games && games.length > 0 && (
        <ul className="space-y-2">
          {games.map((game) => (
            <GameRow
              key={game.id}
              teamId={team.id}
              game={game}
              isOwner={isOwner}
              competitionName={game.competitionId ? compName.get(game.competitionId) : undefined}
              players={players ?? []}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-md px-2.5 py-1 transition-colors ${
        active ? 'bg-white text-pitch-700 shadow-sm' : 'text-slate-500'
      }`}
    >
      {label}
    </button>
  )
}

const RESULT_STYLE: Record<Game['result'], string> = {
  VITORIA: 'bg-pitch-100 text-pitch-700',
  EMPATE: 'bg-slate-100 text-slate-600',
  DERROTA: 'bg-red-100 text-red-600',
}
const RESULT_LETTER: Record<Game['result'], string> = { VITORIA: 'V', EMPATE: 'E', DERROTA: 'D' }

function GameRow({
  teamId,
  game,
  isOwner,
  competitionName,
  players,
}: {
  teamId: string
  game: Game
  isOwner: boolean
  competitionName?: string
  players: import('@/types/models').Player[]
}) {
  const [busy, setBusy] = useState(false)
  const unattributed = game.scoreFor - countAttributedGoals(game.events)

  const onDelete = async () => {
    if (busy) return
    if (!window.confirm('Excluir este jogo e reverter as estatísticas?')) return
    setBusy(true)
    try {
      await deleteGame(teamId, game.id, game, players)
    } catch {
      setBusy(false)
    }
  }

  return (
    <li className="card flex items-center gap-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${RESULT_STYLE[game.result]}`}>
        {RESULT_LETTER[game.result]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">
          {game.scoreFor} <span className="text-slate-400">×</span> {game.scoreAgainst} · {game.opponent}
        </p>
        <p className="truncate text-xs text-slate-500">
          {formatDate(game.date)} ·{' '}
          {game.type === 'CAMPEONATO' ? competitionName ?? 'Campeonato' : 'Amistoso'}
          {unattributed > 0 && ` · ${unattributed} gol(s) não-atribuído(s)`}
        </p>
      </div>
      {isOwner && (
        <div className="flex shrink-0 gap-1">
          <Link
            to={`/time/${teamId}/jogo/${game.id}/editar`}
            className="btn-ghost border border-slate-200 px-2 py-1 text-xs"
          >
            Editar
          </Link>
          <button onClick={onDelete} disabled={busy} className="btn-ghost px-2 py-1 text-xs text-red-600">
            Excluir
          </button>
        </div>
      )}
    </li>
  )
}
