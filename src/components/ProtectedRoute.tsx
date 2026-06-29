import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/**
 * Guarda rotas que exigem login. Enquanto a sessão inicializa, mostra
 * um estado de carregamento para não redirecionar indevidamente. Sem
 * usuário, manda para /login preservando o destino pretendido.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const initializing = useAuthStore((s) => s.initializing)
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        Carregando…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
