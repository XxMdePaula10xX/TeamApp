import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useTeam } from '@/hooks/useTeams'
import { useIsOwner } from '@/hooks/useIsOwner'
import { deleteTeam } from '@/services/teams'
import { recomputeTeamStats } from '@/services/games'
import { Avatar } from '@/components/Avatar'
import { ErrorState, Loading } from '@/components/states'
import { timeSince } from '@/utils/dates'
import { publicTeamUrl, shareLink } from '@/utils/share'
import type { TeamOutletContext } from '@/hooks/useTeamOutlet'

/** Página do time (PRD §7.4) — header + abas. Modo leitura é público. */
export function TeamLayout() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { team, loading, error } = useTeam(teamId)
  const { isOwner } = useIsOwner(team, loading)
  const [busy, setBusy] = useState<null | 'delete' | 'recompute'>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} />
  if (!team)
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-slate-500">Time não encontrado.</p>
        <Link to="/buscar" className="btn-ghost text-sm">
          Voltar à busca
        </Link>
      </div>
    )

  const onDelete = async () => {
    if (busy) return
    if (!window.confirm(`Excluir o time "${team.name}" e todos os seus dados? Esta ação é irreversível.`))
      return
    setBusy('delete')
    try {
      await deleteTeam(team.id)
      navigate('/')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Falha ao excluir.')
      setBusy(null)
    }
  }

  const onRecompute = async () => {
    if (busy) return
    setBusy('recompute')
    setNotice(null)
    try {
      await recomputeTeamStats(team.id)
      setNotice('Estatísticas recalculadas.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Falha ao recalcular.')
    } finally {
      setBusy(null)
    }
  }

  const onShare = async () => {
    const result = await shareLink(`${team.name} — Pelada Manager`, publicTeamUrl(team.id))
    if (result === 'copied') setNotice('Link copiado para a área de transferência!')
    else if (result === 'failed') setNotice('Não foi possível compartilhar o link.')
    else setNotice(null)
  }

  const context: TeamOutletContext = { team, isOwner }

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3">
        <Avatar src={team.logoURL || undefined} name={team.name} size={56} rounded="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold leading-tight">{team.name}</h1>
          {team.foundedAt && (
            <p className="text-xs text-slate-400">No gramado há {timeSince(team.foundedAt)}</p>
          )}
        </div>
        <button
          onClick={onShare}
          className="btn-ghost shrink-0 border border-slate-300 text-xs"
          aria-label="Compartilhar time"
        >
          🔗 Compartilhar
        </button>
      </div>

      {isOwner && (
        <div className="flex flex-wrap gap-2">
          <Link to={`/time/${team.id}/editar`} className="btn-ghost border border-slate-300 text-xs">
            ✏️ Editar
          </Link>
          <button
            onClick={onRecompute}
            disabled={busy !== null}
            className="btn-ghost border border-slate-300 text-xs"
          >
            {busy === 'recompute' ? 'Recalculando…' : '🔄 Recalcular estatísticas'}
          </button>
          <button onClick={onDelete} disabled={busy !== null} className="btn-ghost text-xs text-red-600">
            🗑️ Excluir
          </button>
        </div>
      )}

      {notice && <p className="text-sm text-slate-500">{notice}</p>}

      <nav className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <TeamTab to={`/time/${team.id}`} label="Visão geral" end />
        <TeamTab to={`/time/${team.id}/elenco`} label="Elenco" />
        <TeamTab to={`/time/${team.id}/jogos`} label="Jogos" />
        <TeamTab to={`/time/${team.id}/estatisticas`} label="Estatísticas" />
      </nav>

      <Outlet context={context} />
    </div>
  )
}

function TeamTab({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `whitespace-nowrap rounded-md px-3 py-1.5 transition-colors ${
          isActive ? 'bg-white text-pitch-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`
      }
    >
      {label}
    </NavLink>
  )
}
