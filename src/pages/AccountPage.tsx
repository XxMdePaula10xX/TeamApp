import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { deleteAccount } from '@/services/account'

/** Configurações da conta: sair e excluir conta (e-mail/senha). */
export function AccountPage() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const onDelete = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!password) {
      setError('Digite sua senha para confirmar.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await deleteAccount(password)
      // Conta apagada → o listener limpa a sessão; vamos para o login.
      navigate('/login', { replace: true })
    } catch (err) {
      setError(deleteErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">Conta</h1>

      <div className="card space-y-1">
        <p className="text-xs text-slate-400">E-mail</p>
        <p className="font-medium text-slate-800">{user?.email ?? '—'}</p>
      </div>

      <button onClick={onSignOut} className="btn-ghost w-full border border-slate-300">
        Sair
      </button>

      <div className="card space-y-3 border-red-200">
        <div>
          <h2 className="font-bold text-red-600">Excluir conta</h2>
          <p className="text-sm text-slate-500">
            Apaga sua conta e <strong>todos os times que você criou</strong> (jogadores, jogos e
            estatísticas). Esta ação é <strong>permanente</strong> e não pode ser desfeita.
          </p>
        </div>

        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="btn-danger w-full">
            Quero excluir minha conta
          </button>
        ) : (
          <form onSubmit={onDelete} className="space-y-3">
            <div>
              <label className="label" htmlFor="del-pass">
                Confirme sua senha
              </label>
              <input
                id="del-pass"
                type="password"
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-danger flex-1">
                {busy ? 'Excluindo…' : 'Excluir definitivamente'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false)
                  setPassword('')
                  setError(null)
                }}
                className="btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function deleteErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Senha incorreta.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente de novo em alguns minutos.'
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique a internet.'
    default:
      return err instanceof Error ? err.message : 'Não foi possível excluir a conta.'
  }
}
