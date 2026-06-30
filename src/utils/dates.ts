/**
 * Conversões entre `Timestamp` do Firestore e os formatos usados na UI
 * (input[type=date] usa 'yyyy-MM-dd'). Evita dependência de libs de data
 * no MVP.
 */
import { Timestamp } from 'firebase/firestore'

/** 'yyyy-MM-dd' (fuso local) → Timestamp, ou null se vazio/inválido. */
export function dateInputToTimestamp(value: string | null | undefined): Timestamp | null {
  if (!value) return null
  // Interpreta como meia-noite local para não "voltar um dia" por fuso.
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null
  return Timestamp.fromDate(date)
}

/** Timestamp → 'yyyy-MM-dd' (fuso local) para preencher input[type=date]. */
export function timestampToDateInput(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  const d = ts.toDate()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Tempo relativo curto em pt-BR (ex.: "agora", "há 5 min", "há 2 h", "há 3 d"). */
export function timeAgo(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  const diffMs = Date.now() - ts.toDate().getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d} d`
  return formatDate(ts)
}

/** Formata um Timestamp para exibição curta em pt-BR (ex.: 29/06/2026). */
export function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * "Tempo de casa"/"tempo de existência" em texto humano a partir de uma
 * data de referência (ex.: joinedAt, foundedAt). Ex.: "2 anos e 3 meses".
 */
export function timeSince(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  const start = ts.toDate()
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  if (months < 1) return 'menos de 1 mês'
  const years = Math.floor(months / 12)
  const rem = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ano${years > 1 ? 's' : ''}`)
  if (rem > 0) parts.push(`${rem} ${rem > 1 ? 'meses' : 'mês'}`)
  return parts.join(' e ')
}
