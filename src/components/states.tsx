import type { ReactNode } from 'react'

/** Estado de carregamento padrão. */
export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-400">
      {label}
    </div>
  )
}

/** Estado de erro (ex.: falha de leitura do Firestore). */
export function ErrorState({ error }: { error: Error }) {
  return (
    <div className="card border-red-200 bg-red-50 text-sm text-red-700">
      Ops, algo deu errado: {error.message}
    </div>
  )
}

/** Estado vazio com ícone, título, descrição e ação opcional. */
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-8 text-center">
      <div className="text-4xl" aria-hidden>
        {icon}
      </div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {description && <p className="max-w-xs text-sm text-slate-500">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
