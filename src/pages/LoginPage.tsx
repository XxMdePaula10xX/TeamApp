import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

type Mode = 'signin' | 'signup' | 'reset'

/**
 * Autenticação por e-mail/senha (PRD §7.1): entrar, criar conta e
 * redefinir senha. Visitante anônimo pode pular e ir para a Busca.
 */
export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const initializing = useAuthStore((s) => s.initializing)
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail)
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail)
  const sendPasswordReset = useAuthStore((s) => s.sendPasswordReset)
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Já logado → vai para Meus Times.
  useEffect(() => {
    if (!initializing && user) navigate('/', { replace: true })
  }, [initializing, user, navigate])

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setInfo(null)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setInfo(null)

    if (!email.trim()) {
      setError('Informe seu e-mail.')
      return
    }
    if (mode !== 'reset' && password.length < 6) {
      setError('A senha precisa ter ao menos 6 caracteres.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password)
      } else {
        await sendPasswordReset(email)
        setInfo('Enviamos um link de redefinição para o seu e-mail. Confira a caixa de entrada (e o spam).')
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const titles: Record<Mode, string> = {
    signin: 'Entrar',
    signup: 'Criar conta',
    reset: 'Redefinir senha',
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>
          ⚽
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-pitch-700">Pelada Manager</h1>
        <p className="mt-1 text-sm text-slate-500">
          Artilharia, assistências e aproveitamento do seu fut.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <h2 className="text-center text-sm font-semibold text-slate-600">{titles[mode]}</h2>

        <input
          type="email"
          autoComplete="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />

        {mode !== 'reset' && (
          <input
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Aguarde…' : titles[mode]}
        </button>
      </form>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      {info && <p className="text-center text-sm text-pitch-700">{info}</p>}

      <div className="flex flex-col items-center gap-2 text-sm">
        {mode === 'signin' && (
          <>
            <button onClick={() => switchMode('reset')} className="font-medium text-slate-500 hover:text-slate-700">
              Esqueci minha senha
            </button>
            <p className="text-slate-500">
              Não tem conta?{' '}
              <button onClick={() => switchMode('signup')} className="font-semibold text-pitch-700">
                Criar conta
              </button>
            </p>
          </>
        )}
        {mode === 'signup' && (
          <p className="text-slate-500">
            Já tem conta?{' '}
            <button onClick={() => switchMode('signin')} className="font-semibold text-pitch-700">
              Entrar
            </button>
          </p>
        )}
        {mode === 'reset' && (
          <button onClick={() => switchMode('signin')} className="font-medium text-pitch-700">
            ← Voltar para entrar
          </button>
        )}
      </div>

      <Link to="/buscar" className="text-center text-sm font-medium text-slate-500 hover:text-slate-700">
        Continuar sem conta → buscar um time
      </Link>
    </div>
  )
}

/** Traduz os códigos de erro mais comuns do Firebase Auth. */
function authErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.'
    case 'auth/email-already-in-use':
      return 'Este e-mail já tem conta. Tente entrar.'
    case 'auth/weak-password':
      return 'Senha fraca: use ao menos 6 caracteres.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente de novo em alguns minutos.'
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique a internet.'
    default:
      return err instanceof Error ? err.message : 'Não foi possível concluir.'
  }
}
