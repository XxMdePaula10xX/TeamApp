import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useAppBadge } from '@/hooks/useAppBadge'
import { OnboardingModal } from '@/components/OnboardingModal'

/** Barra de navegação inferior (mobile-first) + topo com identidade. */
export function Layout() {
  const user = useAuthStore((s) => s.user)
  const online = useOnlineStatus()
  const seen = useOnboardingStore((s) => s.seen)
  const openTutorial = useOnboardingStore((s) => s.openTutorial)
  const { unread } = useNotifications(user?.uid)
  useAppBadge(user ? unread : 0)

  // Abre o tutorial automaticamente no primeiro acesso (logado).
  useEffect(() => {
    if (user && !seen) openTutorial()
  }, [user, seen, openTutorial])

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-pitch-700">
          <span aria-hidden>⚽</span>
          Pelada Manager
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={openTutorial}
            className="btn-ghost text-xs"
            aria-label="Ver tutorial"
            title="Como usar o app"
          >
            ❔
          </button>
          {user && (
            <Link
              to="/notificacoes"
              className="btn-ghost relative text-base"
              aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : 'Notificações'}
              title="Notificações"
            >
              🔔
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <Link to="/conta" className="btn-ghost text-xs">
              ⚙️ Conta
            </Link>
          ) : (
            <Link to="/login" className="btn-ghost text-xs">
              Entrar
            </Link>
          )}
        </div>
      </header>

      {!online && (
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-800">
          📡 Você está offline — suas alterações sincronizam ao reconectar.
        </div>
      )}

      <main className="flex-1 space-y-4 p-4">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 grid grid-cols-2 border-t border-slate-200 bg-white">
        <NavTab to="/" label="Meus Times" icon="🛡️" end />
        <NavTab to="/buscar" label="Buscar" icon="🔎" />
      </nav>

      <OnboardingModal />
    </div>
  )
}

function NavTab({
  to,
  label,
  icon,
  end,
}: {
  to: string
  label: string
  icon: string
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
          isActive ? 'text-pitch-700' : 'text-slate-400 hover:text-slate-600'
        }`
      }
    >
      <span aria-hidden className="text-base">
        {icon}
      </span>
      {label}
    </NavLink>
  )
}
