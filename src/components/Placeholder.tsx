import type { ReactNode } from 'react'

/**
 * Estado vazio reutilizável usado nas telas ainda não implementadas
 * (Sprint 0). Cada tela indica em qual sprint o conteúdo real chega.
 */
export function Placeholder({
  title,
  sprint,
  children,
}: {
  title: string
  sprint?: string
  children?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {sprint && (
          <span className="rounded-full bg-pitch-100 px-2 py-0.5 text-xs font-semibold text-pitch-800">
            {sprint}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500">
        Tela montada no scaffold. Conteúdo funcional chega no próximo sprint.
      </p>
      {children && <div className="w-full pt-2">{children}</div>}
    </div>
  )
}
