import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useMyTeams } from '@/hooks/useTeams'
import { Avatar } from '@/components/Avatar'
import { EmptyState, ErrorState, Loading } from '@/components/states'
import { clampTeamStats, goalDifference } from '@/utils/stats'
import type { Team } from '@/types/models'

/** Home / Meus Times (PRD §7.2). */
export function HomePage() {
  const uid = useAuthStore((s) => s.user?.uid)
  const { teams, loading, error } = useMyTeams(uid)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">Meus Times</h1>
        <Link to="/time/novo" className="btn-primary text-sm">
          + Criar time
        </Link>
      </div>

      {loading && <Loading />}
      {error && <ErrorState error={error} />}
      {teams && teams.length === 0 && (
        <EmptyState
          icon="🛡️"
          title="Você ainda não tem times"
          description="Crie seu primeiro time para cadastrar elenco, jogos e acompanhar as estatísticas."
          action={
            <Link to="/time/novo" className="btn-primary text-sm">
              + Criar time
            </Link>
          }
        />
      )}

      {teams && teams.length > 0 && (
        <ul className="space-y-3">
          {teams.map((team) => (
            <li key={team.id}>
              <TeamCard team={team} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TeamCard({ team }: { team: Team }) {
  const s = clampTeamStats(team.stats)
  const diff = goalDifference(s)
  return (
    <Link to={`/time/${team.id}`} className="card flex items-center gap-3 hover:border-pitch-300">
      <Avatar src={team.logoURL || undefined} name={team.name} size={48} rounded="lg" />
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
