/**
 * Converte deltas (TeamStats/PlayerStats) em objetos de update com
 * DOT-NOTATION + FieldValue.increment(). Isto é o que torna a gravação
 * de agregados atômica e offline-safe: usar increment em campos pontuais
 * (`stats.wins`) em vez de substituir o objeto `stats` inteiro (que
 * apagaria os campos não listados).
 *
 * Campos com delta zero são omitidos para não tocar docs/campos
 * desnecessários.
 */
import { increment, type FieldValue } from 'firebase/firestore'
import type { PlayerStats, TeamStats } from '@/types/models'

export type IncrementUpdate = Record<string, FieldValue>

function toIncrement(delta: TeamStats | PlayerStats): IncrementUpdate {
  const out: IncrementUpdate = {}
  for (const [key, value] of Object.entries(delta)) {
    if (value !== 0) out[`stats.${key}`] = increment(value)
  }
  return out
}

export function teamStatsIncrement(delta: TeamStats): IncrementUpdate {
  return toIncrement(delta)
}

export function playerStatsIncrement(delta: PlayerStats): IncrementUpdate {
  return toIncrement(delta)
}

/** true se o update não tem nenhum campo (delta totalmente zerado). */
export function isEmptyUpdate(update: IncrementUpdate): boolean {
  return Object.keys(update).length === 0
}
