import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/**
 * Login com Google e e-mail/senha (PRD §7.1). Visitante anônimo pode
 * pular e ir direto para a Busca. O tratamento fino de erros e a
 * criação do doc em `users/{uid}` são detalhados no Sprint 1.
 */
export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const initializing = useAuthStore((s) => s.initializing)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Já logado → vai para Meus Times.
  useEffect(() => {
    if (!initializing && user) navigate('/', { replace: true })
  }, [initializing, user, navigate])

  const wrap = async (fn: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setBusy(false)
    }
  }

  const onEmailSubmit = (e: FormEvent) => {
    e.preventDefault()
    void wrap(() => signInWithEmail(email, password))
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>
          ⚽
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-pitch-700">
          Pelada Manager
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Artilharia, assistências e aproveitamento do seu fut.
        </p>
      </div>

      <button
        onClick={() => void wrap(signInWithGoogle)}
        disabled={busy}
        className="btn w-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      >
        <span aria-hidden>🔵</span> Entrar com Google
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> ou <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={onEmailSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pitch-500 focus:outline-none"
        />
        <input
          type="password"
          required
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pitch-500 focus:outline-none"
        />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          Entrar
        </button>
      </form>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <Link to="/buscar" className="text-center text-sm font-medium text-slate-500 hover:text-slate-700">
        Continuar sem conta → buscar um time
      </Link>
    </div>
  )
}
