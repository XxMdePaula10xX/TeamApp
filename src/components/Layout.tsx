import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/** Barra de navegação inferior (mobile-first) + topo com identidade. */
export function Layout() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-pitch-700">
          <span aria-hidden>⚽</span>
          Pelada Manager
        </Link>
        {user ? (
          <button onClick={handleSignOut} className="btn-ghost text-xs">
            Sair
          </button>
        ) : (
          <Link to="/login" className="btn-ghost text-xs">
            Entrar
          </Link>
        )}
      </header>

      <main className="flex-1 space-y-4 p-4">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 grid grid-cols-2 border-t border-slate-200 bg-white">
        <NavTab to="/" label="Meus Times" icon="🛡️" end />
        <NavTab to="/buscar" label="Buscar" icon="🔎" />
      </nav>
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
