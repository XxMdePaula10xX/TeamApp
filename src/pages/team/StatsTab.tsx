import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { useTeamOutlet } from '@/hooks/useTeamOutlet'
import { usePlayers } from '@/hooks/usePlayers'
import { useGames } from '@/hooks/useGames'
import { Avatar } from '@/components/Avatar'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import {
  EMPTY_PLAYER_STATS,
  applyPlayerStats,
  clampPlayerStats,
  clampTeamStats,
  playerDeltas,
} from '@/utils/stats'
import type { GameType, Player, PlayerStats } from '@/types/models'

const PlayerBars = lazy(() => import('@/components/charts/PlayerBars'))
const ChartFallback = () => (
  <div className="flex h-[140px] items-center justify-center text-xs text-slate-400">
    Carregando gráfico…
  </div>
)

type Filter = GameType | 'TODOS'
type Row = { player: Player; stats: PlayerStats }

const firstName = (name: string) => name.trim().split(/\s+/)[0]

/** Aba Estatísticas (PRD §7.4): artilharia, assistências, gols, frequência. */
export function StatsTab() {
  const { team } = useTeamOutlet()
  const [filter, setFilter] = useState<Filter>('TODOS')
  const { players, loading: playersLoading, error: playersError } = usePlayers(team.id)
  const { games, loading: gamesLoading } = useGames(team.id, filter === 'TODOS' ? null : filter)

  // No modo "Todos" usa os agregados denormalizados (precisos, ilimitados).
  // Filtrado por tipo, recalcula a partir dos jogos carregados.
  const rows = useMemo<Row[]>(() => {
    const list = players ?? []
    if (filter === 'TODOS') {
      return list.map((p) => ({ player: p, stats: clampPlayerStats(p.stats) }))
    }
    const acc = new Map<string, PlayerStats>()
    for (const g of games ?? []) {
      for (const [pid, delta] of playerDeltas({
        scoreFor: g.scoreFor,
        scoreAgainst: g.scoreAgainst,
        presentPlayerIds: g.presentPlayerIds,
        events: g.events,
      })) {
        acc.set(pid, applyPlayerStats(acc.get(pid) ?? EMPTY_PLAYER_STATS, delta, 1))
      }
    }
    return list.map((p) => ({ player: p, stats: acc.get(p.id) ?? EMPTY_PLAYER_STATS }))
  }, [filter, players, games])

  const totalGames =
    filter === 'TODOS' ? clampTeamStats(team.stats).played : (games?.length ?? 0)

  const scorers = useMemo(
    () => rows.filter((r) => r.stats.goals > 0).sort((a, b) => b.stats.goals - a.stats.goals),
    [rows],
  )
  const assisters = useMemo(
    () => rows.filter((r) => r.stats.assists > 0).sort((a, b) => b.stats.assists - a.stats.assists),
    [rows],
  )
  const attendance = useMemo(
    () =>
      rows
        .filter((r) => r.stats.gamesPlayed > 0)
        .sort((a, b) => b.stats.gamesPlayed - a.stats.gamesPlayed),
    [rows],
  )

  if (playersLoading || (filter !== 'TODOS' && gamesLoading)) return <Loading />
  if (playersError) return <ErrorState error={playersError} />

  if ((players?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon="📊"
        title="Sem estatísticas ainda"
        description="Cadastre jogadores e jogos para ver artilharia, assistências e frequência."
      />
    )
  }

  const hasData = scorers.length > 0 || assisters.length > 0 || attendance.length > 0

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
        <FilterBtn label="Todos" active={filter === 'TODOS'} onClick={() => setFilter('TODOS')} />
        <FilterBtn label="Amistosos" active={filter === 'AMISTOSO'} onClick={() => setFilter('AMISTOSO')} />
        <FilterBtn label="Campeonato" active={filter === 'CAMPEONATO'} onClick={() => setFilter('CAMPEONATO')} />
      </div>

      {!hasData && (
        <div className="card text-center text-sm text-slate-500">
          Nenhum dado para este filtro ainda.
        </div>
      )}

      {scorers.length > 0 && (
        <Section title="🥇 Artilharia">
          <RankList rows={scorers} pick={(s) => s.goals} unit="gol" />
        </Section>
      )}

      {scorers.length > 0 && (
        <Section title="Gols por jogador">
          <Suspense fallback={<ChartFallback />}>
            <PlayerBars
              data={scorers.slice(0, 10).map((r) => ({ name: firstName(r.player.name), value: r.stats.goals }))}
              color="#16a34a"
            />
          </Suspense>
        </Section>
      )}

      {assisters.length > 0 && (
        <Section title="🅰 Líderes de assistência">
          <RankList rows={assisters} pick={(s) => s.assists} unit="assist." />
        </Section>
      )}

      {attendance.length > 0 && (
        <Section title={`📋 Frequência${totalGames > 0 ? ` (de ${totalGames} jogos)` : ''}`}>
          <Suspense fallback={<ChartFallback />}>
            <PlayerBars
              data={attendance.slice(0, 12).map((r) => ({
                name: firstName(r.player.name),
                value: r.stats.gamesPlayed,
              }))}
              color="#0ea5e9"
              max={totalGames || undefined}
            />
          </Suspense>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card space-y-2">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  )
}

function RankList({
  rows,
  pick,
  unit,
}: {
  rows: Row[]
  pick: (s: PlayerStats) => number
  unit: string
}) {
  const top = rows.slice(0, 10)
  return (
    <ul className="divide-y divide-slate-100">
      {top.map((r, i) => {
        const value = pick(r.stats)
        return (
          <li key={r.player.id} className="flex items-center gap-3 py-2">
            <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
            <Avatar src={r.player.photoURL || undefined} name={r.player.name} size={32} />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{r.player.name}</span>
            <span className="text-sm font-bold text-slate-900">
              {value} <span className="text-xs font-normal text-slate-400">{unit}{value > 1 ? 's' : ''}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[36px] flex-1 whitespace-nowrap rounded-md px-2.5 py-1 transition-colors ${
        active ? 'bg-white text-pitch-700 shadow-sm' : 'text-slate-500'
      }`}
    >
      {label}
    </button>
  )
}
