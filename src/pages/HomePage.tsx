import { Link } from 'react-router-dom'
import { Placeholder } from '@/components/Placeholder'

/** Home / Meus Times (PRD §7.2). Lista de times do usuário + criar. */
export function HomePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">Meus Times</h1>
        <Link to="/time/novo" className="btn-primary text-sm">
          + Criar time
        </Link>
      </div>

      <Placeholder title="Lista de times" sprint="Sprint 1">
        <p className="text-sm text-slate-500">
          Aqui entram os cards dos times que você administra (logo, nome e resumo V/E/D),
          carregados de <code className="rounded bg-slate-100 px-1">teams</code> por{' '}
          <code className="rounded bg-slate-100 px-1">ownerId</code>.
        </p>
      </Placeholder>
    </div>
  )
}
