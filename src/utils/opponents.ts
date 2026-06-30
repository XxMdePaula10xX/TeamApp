/**
 * Retrospecto por adversário: agrupa jogos pelo nome normalizado do
 * oponente (junta "Os Bagre"/"os bagre") e soma V/E/D + gols.
 */
import type { Game } from '@/types/models'
import { normalizeName } from '@/utils/normalize'

export interface OpponentRecord {
  opponent: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
}

export function opponentRecords(games: Game[]): OpponentRecord[] {
  const map = new Map<string, OpponentRecord>()
  for (const g of games) {
    const key = normalizeName(g.opponent)
    if (!key) continue
    const rec =
      map.get(key) ??
      { opponent: g.opponent, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
    rec.played += 1
    if (g.result === 'VITORIA') rec.wins += 1
    else if (g.result === 'EMPATE') rec.draws += 1
    else rec.losses += 1
    rec.goalsFor += g.scoreFor
    rec.goalsAgainst += g.scoreAgainst
    map.set(key, rec)
  }
  return [...map.values()].sort((a, b) => b.played - a.played || a.opponent.localeCompare(b.opponent, 'pt-BR'))
}
