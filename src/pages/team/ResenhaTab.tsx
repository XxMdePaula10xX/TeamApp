import { useMemo } from 'react'
import { useTeamOutlet } from '@/hooks/useTeamOutlet'
import { useGames } from '@/hooks/useGames'
import { usePlayers } from '@/hooks/usePlayers'
import { EmptyState, Loading } from '@/components/states'
import { buildMilestones } from '@/utils/milestones'
import { clampTeamStats } from '@/utils/stats'
import { formatDate } from '@/utils/dates'

/** Aba Resenha — feed de marcos automáticos do time (ideia #4). */
export function ResenhaTab() {
  const { team } = useTeamOutlet()
  const { games, loading: gamesLoading } = useGames(team.id)
  const { players, loading: playersLoading } = usePlayers(team.id)

  const milestones = useMemo(
    () => buildMilestones(clampTeamStats(team.stats), games ?? [], players ?? []),
    [team.stats, games, players],
  )

  if (gamesLoading || playersLoading) return <Loading />

  if (milestones.length === 0) {
    return (
      <EmptyState
        icon="📰"
        title="A resenha começa aqui"
        description="Conforme você registra jogos e os jogadores fazem história, os marcos do time aparecem nesta linha do tempo."
      />
    )
  }

  return (
    <ol className="space-y-3">
      {milestones.map((m) => (
        <li key={m.id} className="card flex items-start gap-3">
          <span className="text-2xl leading-none" aria-hidden>
            {m.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800">{m.text}</p>
            {m.date && <p className="text-xs text-slate-400">{formatDate(m.date)}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
