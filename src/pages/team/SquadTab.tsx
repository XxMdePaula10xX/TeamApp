import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTeamOutlet } from '@/hooks/useTeamOutlet'
import { usePlayers } from '@/hooks/usePlayers'
import { useGames } from '@/hooks/useGames'
import { setPlayerActive } from '@/services/players'
import { Avatar } from '@/components/Avatar'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { POSITION_LABELS, type Player } from '@/types/models'
import { timeSince } from '@/utils/dates'
import { playerLabel } from '@/utils/players'
import { clampTeamStats } from '@/utils/stats'
import { computeAchievements, type Badge } from '@/utils/achievements'

/** Aba Elenco (PRD §7.4). */
export function SquadTab() {
  const { team, isOwner } = useTeamOutlet()
  const { players, loading, error } = usePlayers(team.id)
  const { games } = useGames(team.id)

  const badges = useMemo(
    () => computeAchievements(players ?? [], clampTeamStats(team.stats), games ?? []),
    [players, team.stats, games],
  )

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} />

  const active = players?.filter((p) => p.active) ?? []
  const inactive = players?.filter((p) => !p.active) ?? []

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Link to={`/time/${team.id}/jogador/novo`} className="btn-primary text-sm">
            + Adicionar jogador
          </Link>
        </div>
      )}

      {active.length === 0 && inactive.length === 0 && (
        <EmptyState
          icon="👕"
          title="Elenco vazio"
          description={isOwner ? 'Adicione jogadores para registrar gols, assistências e presença.' : 'Este time ainda não cadastrou jogadores.'}
          action={
            isOwner ? (
              <Link to={`/time/${team.id}/jogador/novo`} className="btn-primary text-sm">
                + Adicionar jogador
              </Link>
            ) : undefined
          }
        />
      )}

      {active.length > 0 && (
        <ul className="space-y-2">
          {active.map((p) => (
            <PlayerRow key={p.id} teamId={team.id} player={p} isOwner={isOwner} badges={badges.get(p.id) ?? []} />
          ))}
        </ul>
      )}

      {inactive.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Inativos</h3>
          <ul className="space-y-2">
            {inactive.map((p) => (
              <PlayerRow key={p.id} teamId={team.id} player={p} isOwner={isOwner} badges={badges.get(p.id) ?? []} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PlayerRow({
  teamId,
  player,
  isOwner,
  badges,
}: {
  teamId: string
  player: Player
  isOwner: boolean
  badges: Badge[]
}) {
  const [busy, setBusy] = useState(false)
  const label = playerLabel(player)
  const hasNick = !!player.nickname?.trim()

  const toggleActive = async () => {
    setBusy(true)
    try {
      await setPlayerActive(teamId, player.id, !player.active)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className={`card flex items-center gap-3 ${player.active ? '' : 'opacity-60'}`}>
      <div className="relative">
        <Avatar src={player.photoURL || undefined} name={label} size={44} />
        {player.shirtNumber != null && (
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pitch-600 px-1 text-[10px] font-bold text-white">
            {player.shirtNumber}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate font-semibold text-slate-900">
          {label}
          {badges.length > 0 && (
            <span className="shrink-0" title={badges.map((b) => b.label).join(' · ')}>
              {badges.map((b) => (
                <span key={b.id} aria-hidden>
                  {b.emoji}
                </span>
              ))}
            </span>
          )}
        </p>
        <p className="truncate text-xs text-slate-500">
          {hasNick && <span className="text-slate-400">{player.name} · </span>}
          {POSITION_LABELS[player.position]}
          {player.joinedAt && ` · há ${timeSince(player.joinedAt)} no time`}
        </p>
      </div>
      {isOwner && (
        <div className="flex shrink-0 gap-1">
          <Link
            to={`/time/${teamId}/jogador/${player.id}/editar`}
            className="btn-ghost border border-slate-200 px-2 py-1 text-xs"
          >
            Editar
          </Link>
          <button onClick={toggleActive} disabled={busy} className="btn-ghost px-2 py-1 text-xs">
            {player.active ? 'Desativar' : 'Reativar'}
          </button>
        </div>
      )}
    </li>
  )
}
