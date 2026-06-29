import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <div className="text-5xl" aria-hidden>
        🥅
      </div>
      <h1 className="text-lg font-bold">Página não encontrada</h1>
      <p className="text-sm text-slate-500">Essa bola foi pra fora.</p>
      <Link to="/" className="btn-primary text-sm">
        Voltar ao início
      </Link>
    </div>
  )
}
