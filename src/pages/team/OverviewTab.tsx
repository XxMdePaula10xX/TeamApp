import { lazy, Suspense, useMemo } from 'react'
import { useTeamOutlet } from '@/hooks/useTeamOutlet'
import { useGames } from '@/hooks/useGames'
import { clampTeamStats, goalDifference, winPercentage } from '@/utils/stats'
import type { EvolutionPoint } from '@/components/charts/PointsEvolution'

const ResultPie = lazy(() => import('@/components/charts/ResultPie'))
const PointsEvolution = lazy(() => import('@/components/charts/PointsEvolution'))

const POINTS = { VITORIA: 3, EMPATE: 1, DERROTA: 0 } as const
const ChartFallback = () => (
  <div className="flex h-[200px] items-center justify-center text-xs text-slate-400">
    Carregando gráfico…
  </div>
)

/** Aba Visão geral (PRD §7.4) — cards + pizza V/E/D + evolução de pontos. */
export function OverviewTab() {
  const { team } = useTeamOutlet()
  const { games } = useGames(team.id)
  const s = clampTeamStats(team.stats)
  const diff = goalDifference(s)

  // Pontos acumulados por jogo (ordem cronológica crescente).
  const evolution = useMemo<EvolutionPoint[]>(() => {
    if (!games) return []
    const asc = [...games].reverse()
    let acc = 0
    return asc.map((g, i) => {
      acc += POINTS[g.result]
      return { label: `J${i + 1}`, points: acc, opponent: g.opponent }
    })
  }, [games])

  if (s.played === 0) {
    return (
      <div className="card text-center text-sm text-slate-500">
        Ainda sem jogos. Cadastre o primeiro jogo para ver o aproveitamento.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Vitórias" value={s.wins} tone="text-pitch-600" />
        <Stat label="Empates" value={s.draws} tone="text-slate-500" />
        <Stat label="Derrotas" value={s.losses} tone="text-red-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Jogos" value={s.played} />
        <Stat label="Aproveitamento" value={`${winPercentage(s)}%`} />
        <Stat label="Gols pró" value={s.goalsFor} />
        <Stat label="Gols contra" value={s.goalsAgainst} />
      </div>

      <div className="card flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">Saldo de gols</span>
        <span
          className={`text-lg font-extrabold ${
            diff > 0 ? 'text-pitch-600' : diff < 0 ? 'text-red-500' : 'text-slate-500'
          }`}
        >
          {diff > 0 ? `+${diff}` : diff}
        </span>
      </div>

      <div className="card">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Resultados</h3>
        <Suspense fallback={<ChartFallback />}>
          <ResultPie wins={s.wins} draws={s.draws} losses={s.losses} />
        </Suspense>
        <div className="mt-2 flex justify-center gap-4 text-xs text-slate-500">
          <Legend color="#16a34a" label={`${s.wins} V`} />
          <Legend color="#94a3b8" label={`${s.draws} E`} />
          <Legend color="#ef4444" label={`${s.losses} D`} />
        </div>
      </div>

      {evolution.length >= 2 && (
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Evolução de pontos</h3>
          <Suspense fallback={<ChartFallback />}>
            <PointsEvolution data={evolution} />
          </Suspense>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  tone = 'text-slate-900',
}: {
  label: string
  value: number | string
  tone?: string
}) {
  return (
    <div className="card flex flex-col items-center gap-1 py-3">
      <span className={`text-2xl font-extrabold ${tone}`}>{value}</span>
      <span className="text-center text-xs text-slate-500">{label}</span>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
