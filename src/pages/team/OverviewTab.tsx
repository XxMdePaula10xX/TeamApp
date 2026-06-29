import { useTeamOutlet } from '@/hooks/useTeamOutlet'
import { clampTeamStats, goalDifference, winPercentage } from '@/utils/stats'

/**
 * Aba Visão geral (PRD §7.4) — cards de aproveitamento. Gráficos (pizza
 * V/E/D, evolução) entram no Sprint 2. Lê apenas team.stats embutido (sem
 * subscriptions extras).
 */
export function OverviewTab() {
  const { team } = useTeamOutlet()
  const s = clampTeamStats(team.stats)
  const diff = goalDifference(s)

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
