import { NavLink, Outlet, useParams } from 'react-router-dom'

/**
 * Página do time (PRD §7.4) — a tela central. Cabeçalho do time +
 * navegação por abas (Visão geral / Elenco / Jogos / Estatísticas).
 * Modo leitura é público; botões de edição aparecem só para o dono
 * (lógica de ownership entra no Sprint 1).
 */
export function TeamLayout() {
  const { teamId } = useParams()

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pitch-100 text-2xl">
          🛡️
        </div>
        <div>
          <h1 className="text-lg font-extrabold leading-tight">Time</h1>
          <p className="text-xs text-slate-400">
            id: <code className="rounded bg-slate-100 px-1">{teamId}</code>
          </p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <TeamTab to={`/time/${teamId}`} label="Visão geral" end />
        <TeamTab to={`/time/${teamId}/elenco`} label="Elenco" />
        <TeamTab to={`/time/${teamId}/jogos`} label="Jogos" />
        <TeamTab to={`/time/${teamId}/estatisticas`} label="Estatísticas" />
      </nav>

      <Outlet />
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
