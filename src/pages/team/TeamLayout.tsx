import { lazy, Suspense, useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useTeam } from '@/hooks/useTeams'
import { useIsOwner } from '@/hooks/useIsOwner'
import { useTeamTheme } from '@/hooks/useTeamTheme'
import { useThemeStore } from '@/store/themeStore'
import { Avatar } from '@/components/Avatar'
import { Jersey } from '@/components/Jersey'
import { ErrorState, Loading } from '@/components/states'
import { timeSince } from '@/utils/dates'
import { publicTeamUrl, shareLink } from '@/utils/share'
import type { TeamOutletContext } from '@/hooks/useTeamOutlet'

const QrModal = lazy(() => import('@/components/QrModal'))

/** Página do time (PRD §7.4) — header + abas. Modo leitura é público. */
export function TeamLayout() {
  const { teamId } = useParams()
  const { team, loading, error } = useTeam(teamId)
  const { isOwner } = useIsOwner(team, loading)
  const useTeamColors = useThemeStore((s) => s.useTeamColors)
  const toggleTeamColors = useThemeStore((s) => s.toggle)
  const [notice, setNotice] = useState<string | null>(null)
  const [qrOpen, setQrOpen] = useState(false)

  // Aplica a cor do time no tema enquanto esta página estiver montada.
  useTeamTheme(team)

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
        {(team.secondaryColor || (team.pattern && team.pattern !== 'SOLID')) && (
          <Jersey
            primary={team.primaryColor ?? '#16a34a'}
            secondary={team.secondaryColor}
            pattern={team.pattern ?? 'SOLID'}
            size={44}
          />
        )}
        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={onShare}
            className="btn-ghost border border-slate-300 text-xs"
            aria-label="Compartilhar time"
          >
            🔗 Compartilhar
          </button>
          <button
            onClick={() => setQrOpen(true)}
            className="btn-ghost border border-slate-300 text-xs"
            aria-label="Mostrar QR Code do time"
          >
            ▦ QR Code
          </button>
        </div>
      </div>

      {(team.city || team.phone) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm text-slate-600">
          {team.city && (
            <span className="flex items-center gap-1">
              <span aria-hidden>📍</span> {team.city}
            </span>
          )}
          {team.phone && <ContactPhone phone={team.phone} />}
        </div>
      )}

      {team.primaryColor && (
        <button
          onClick={toggleTeamColors}
          aria-pressed={useTeamColors}
          className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            useTeamColors
              ? 'border-pitch-500 bg-pitch-50 text-pitch-700'
              : 'border-slate-300 text-slate-500'
          }`}
        >
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.primaryColor }} />
          {useTeamColors ? 'Cores do time' : 'Cor padrão do app'}
        </button>
      )}

      {isOwner && (
        <div className="flex flex-wrap gap-2">
          <Link to={`/time/${team.id}/editar`} className="btn-ghost border border-slate-300 text-xs">
            ✏️ Editar time
          </Link>
        </div>
      )}

      {notice && <p className="text-sm text-slate-500">{notice}</p>}

      <nav className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <TeamTab to={`/time/${team.id}`} label="Visão geral" end />
        <TeamTab to={`/time/${team.id}/elenco`} label="Elenco" />
        <TeamTab to={`/time/${team.id}/jogos`} label="Jogos" />
        <TeamTab to={`/time/${team.id}/estatisticas`} label="Estatísticas" />
        <TeamTab to={`/time/${team.id}/resenha`} label="Resenha" />
      </nav>

      <Outlet context={context} />

      {qrOpen && (
        <Suspense fallback={null}>
          <QrModal url={publicTeamUrl(team.id)} title={`${team.name} — Pelada Manager`} onClose={() => setQrOpen(false)} />
        </Suspense>
      )}
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

/** Telefone de contato com link de WhatsApp (para marcar amistosos/treinos). */
function ContactPhone({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, '')
  // Prefixa 55 (Brasil) se vier sem código do país (10–11 dígitos).
  const wa = digits.length >= 12 ? digits : `55${digits}`
  if (digits.length < 10) {
    return (
      <span className="flex items-center gap-1">
        <span aria-hidden>📞</span> {phone}
      </span>
    )
  }
  return (
    <a
      href={`https://wa.me/${wa}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 font-medium text-pitch-700 hover:underline"
      title="Chamar no WhatsApp para amistosos/treinos"
    >
      <span aria-hidden>📞</span> {phone}
    </a>
  )
}
