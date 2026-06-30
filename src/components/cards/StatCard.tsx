/**
 * Card de estatística estilizado para exportar como PNG e compartilhar.
 * Largura fixa (bom para captura). NÃO usa imagens externas (logos via
 * Storage) de propósito — evita problemas de CORS/canvas tainted na
 * captura; usa o monograma do time.
 */
export interface StatCardRow {
  label?: string
  rank?: number
  name: string
  value: number
  unit: string
}

interface StatCardProps {
  teamName: string
  title: string
  emoji: string
  rows: StatCardRow[]
  note?: string
}

// Captura é feita pelo wrapper em ShareCardModal — sem ref próprio aqui.
export function StatCard({ teamName, title, emoji, rows, note }: StatCardProps) {
  const initial = teamName.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      className="w-[340px] overflow-hidden rounded-2xl bg-gradient-to-br from-pitch-700 to-pitch-950 p-6 text-white"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl font-extrabold">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold leading-tight">{teamName}</p>
          <p className="text-xs text-pitch-200">⚽ Pelada Manager</p>
        </div>
      </div>

      <div className="mt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-pitch-200">
          {emoji} {title}
        </h2>
        <ul className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-3">
              {r.rank != null && (
                <span className="w-6 text-center text-lg font-black text-pitch-300">{r.rank}</span>
              )}
              <div className="min-w-0 flex-1">
                {r.label && <p className="text-[10px] uppercase tracking-wide text-pitch-300">{r.label}</p>}
                <p className="truncate font-semibold leading-tight">{r.name}</p>
              </div>
              <span className="shrink-0 text-xl font-extrabold">
                {r.value}
                <span className="ml-1 text-xs font-medium text-pitch-200">{r.unit}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {note && <p className="mt-4 text-[11px] text-pitch-300">{note}</p>}
    </div>
  )
}
