import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { useTeamOutlet } from '@/hooks/useTeamOutlet'
import { usePlayers } from '@/hooks/usePlayers'
import { GAMES_LIMIT, useGames } from '@/hooks/useGames'
import { Avatar } from '@/components/Avatar'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { StatCard, type StatCardRow } from '@/components/cards/StatCard'
import {
  EMPTY_PLAYER_STATS,
  applyPlayerStats,
  clampPlayerStats,
  clampTeamStats,
  playerDeltas,
} from '@/utils/stats'
import type { GameType, Player, PlayerStats } from '@/types/models'

const PlayerBars = lazy(() => import('@/components/charts/PlayerBars'))
const ShareCardModal = lazy(() => import('@/components/cards/ShareCardModal'))

interface CardConfig {
  title: string
  emoji: string
  rows: StatCardRow[]
  filename: string
  note?: string
}
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
  const [card, setCard] = useState<CardConfig | null>(null)
  const { players, loading: playersLoading, error: playersError } = usePlayers(team.id)
  const { games, loading: gamesLoading } = useGames(team.id, filter === 'TODOS' ? null : filter)

  const filterLabel =
    filter === 'TODOS' ? 'Todos os jogos' : filter === 'AMISTOSO' ? 'Amistosos' : 'Campeonato'

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

  // Desempate por nome (pt-BR) para ordem determinística e justa.
  const byName = (a: Row, b: Row) => a.player.name.localeCompare(b.player.name, 'pt-BR')
  const scorers = useMemo(
    () =>
      rows
        .filter((r) => r.stats.goals > 0)
        .sort((a, b) => b.stats.goals - a.stats.goals || byName(a, b)),
    [rows],
  )
  const assisters = useMemo(
    () =>
      rows
        .filter((r) => r.stats.assists > 0)
        .sort((a, b) => b.stats.assists - a.stats.assists || byName(a, b)),
    [rows],
  )
  const attendance = useMemo(
    () =>
      rows
        .filter((r) => r.stats.gamesPlayed > 0)
        .sort((a, b) => b.stats.gamesPlayed - a.stats.gamesPlayed || byName(a, b)),
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

      {filter !== 'TODOS' && (games?.length ?? 0) === GAMES_LIMIT && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Mostrando apenas os {GAMES_LIMIT} jogos mais recentes deste tipo — os totais podem ser
          maiores em “Todos”.
        </p>
      )}

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
              data={scorers.slice(0, 10).map((r) => ({
                id: r.player.id,
                name: firstName(r.player.name),
                value: r.stats.goals,
              }))}
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
                id: r.player.id,
                name: firstName(r.player.name),
                value: r.stats.gamesPlayed,
              }))}
              color="#0ea5e9"
              max={totalGames || undefined}
            />
          </Suspense>
        </Section>
      )}

      {hasData && (
        <Section title="📸 Cards compartilháveis">
          <p className="text-xs text-slate-500">Gere uma imagem para postar no grupo da pelada.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {scorers.length > 0 && (
              <button
                onClick={() =>
                  setCard({
                    title: 'Artilharia',
                    emoji: '🥇',
                    rows: scorers.slice(0, 5).map((r, i) => ({
                      rank: i + 1,
                      name: r.player.name,
                      value: r.stats.goals,
                      unit: r.stats.goals === 1 ? 'gol' : 'gols',
                    })),
                    filename: `artilharia-${slug(team.normalizedName)}.png`,
                    note: filterLabel,
                  })
                }
                className="btn-ghost border border-slate-300 text-sm"
              >
                🥇 Artilharia
              </button>
            )}
            <button
              onClick={() => setCard(buildHighlightsCard())}
              className="btn-ghost border border-slate-300 text-sm"
            >
              ⭐ Destaques
            </button>
          </div>
        </Section>
      )}

      {card && (
        <Suspense fallback={null}>
          <ShareCardModal
            filename={card.filename}
            shareTitle={`${card.title} — ${team.name}`}
            onClose={() => setCard(null)}
          >
            <StatCard
              teamName={team.name}
              title={card.title}
              emoji={card.emoji}
              rows={card.rows}
              note={card.note}
            />
          </ShareCardModal>
        </Suspense>
      )}
    </div>
  )

  function buildHighlightsCard(): CardConfig {
    const rows: StatCardRow[] = []
    if (scorers[0])
      rows.push({ label: 'Artilheiro', name: scorers[0].player.name, value: scorers[0].stats.goals, unit: scorers[0].stats.goals === 1 ? 'gol' : 'gols' })
    if (assisters[0])
      rows.push({ label: 'Garçom', name: assisters[0].player.name, value: assisters[0].stats.assists, unit: 'assist.' })
    if (attendance[0])
      rows.push({ label: 'Presença', name: attendance[0].player.name, value: attendance[0].stats.gamesPlayed, unit: attendance[0].stats.gamesPlayed === 1 ? 'jogo' : 'jogos' })
    return { title: 'Destaques', emoji: '⭐', rows, filename: `destaques-${slug(team.normalizedName)}.png`, note: filterLabel }
  }
}

const slug = (s: string) => s.replace(/\s+/g, '-') || 'time'

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
  const remaining = rows.length - top.length
  return (
    <ul className="divide-y divide-slate-100">
      {top.map((r) => {
        const value = pick(r.stats)
        // Ranking de competição: empatados compartilham a mesma posição.
        const rank = top.findIndex((x) => pick(x.stats) === value) + 1
        return (
          <li key={r.player.id} className="flex items-center gap-3 py-2">
            <span className="w-5 text-center text-sm font-bold text-slate-400">{rank}</span>
            <Avatar src={r.player.photoURL || undefined} name={r.player.name} size={32} />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{r.player.name}</span>
            <span className="text-sm font-bold text-slate-900">
              {value} <span className="text-xs font-normal text-slate-400">{unit}{value > 1 ? 's' : ''}</span>
            </span>
          </li>
        )
      })}
      {remaining > 0 && (
        <li className="py-2 text-center text-xs text-slate-400">
          +{remaining} jogador{remaining > 1 ? 'es' : ''}
        </li>
      )}
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
