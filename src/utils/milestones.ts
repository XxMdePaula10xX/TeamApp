/**
 * "Resenha do time": marcos automáticos a partir dos jogos + jogadores.
 * Tudo derivado no client (sem armazenamento extra). Itens com data vêm
 * primeiro (mais recentes no topo); marcos de jogador (sem data) ao final.
 */
import type { Game, Player, TeamStats } from '@/types/models'
import type { Timestamp } from 'firebase/firestore'
import { playerLabel } from '@/utils/players'

export interface Milestone {
  id: string
  emoji: string
  text: string
  date: Timestamp | null
}

const GAME_THRESHOLDS = [10, 25, 50, 100, 150, 200, 300]
const GOAL_THRESHOLDS = [25, 50, 100, 200, 300, 500]
const PLAYER_GOALS = [10, 25, 50, 100, 150]
const PLAYER_GAMES = [25, 50, 100, 200]

const highestReached = (value: number, thresholds: number[]): number | null => {
  let best: number | null = null
  for (const t of thresholds) if (value >= t) best = t
  return best
}

export function buildMilestones(
  _teamStats: TeamStats,
  games: Game[],
  players: Player[],
): Milestone[] {
  const out: Milestone[] = []

  // Cronológico crescente para acumular jogos/gols.
  const asc = [...games].reverse()
  let played = 0
  let goalsFor = 0
  const goalSeen = new Set<number>()
  let biggest: { diff: number; g: Game } | null = null

  for (const g of asc) {
    played += 1
    goalsFor += g.scoreFor
    for (const t of GAME_THRESHOLDS) {
      if (played === t) out.push({ id: `gm${t}`, emoji: '📅', text: `${t} jogos disputados!`, date: g.date })
    }
    for (const t of GOAL_THRESHOLDS) {
      if (goalsFor >= t && !goalSeen.has(t)) {
        goalSeen.add(t)
        out.push({ id: `gl${t}`, emoji: '⚽', text: `${t}º gol marcado pelo time!`, date: g.date })
      }
    }
    const diff = g.scoreFor - g.scoreAgainst
    if (diff > 0 && (!biggest || diff > biggest.diff)) biggest = { diff, g }
  }

  if (biggest && biggest.diff >= 3) {
    out.push({
      id: 'goleada',
      emoji: '💪',
      text: `Maior goleada: ${biggest.g.scoreFor}×${biggest.g.scoreAgainst} contra ${biggest.g.opponent}`,
      date: biggest.g.date,
    })
  }

  // Sequência de vitórias atual (games vem do mais recente).
  let streak = 0
  for (const g of games) {
    if (g.result === 'VITORIA') streak += 1
    else break
  }
  if (streak >= 3) {
    out.push({ id: 'streak', emoji: '🔥', text: `Embalado! ${streak} vitórias seguidas`, date: games[0]?.date ?? null })
  }

  // Marcos por jogador (sem data).
  for (const p of players) {
    const g = highestReached(p.stats.goals, PLAYER_GOALS)
    if (g) out.push({ id: `p-g-${p.id}`, emoji: '🎯', text: `${playerLabel(p)} chegou a ${g} gols`, date: null })
    const j = highestReached(p.stats.gamesPlayed, PLAYER_GAMES)
    if (j) out.push({ id: `p-j-${p.id}`, emoji: '🧦', text: `${playerLabel(p)} completou ${j} jogos`, date: null })
  }

  // Ordena: com data (desc) primeiro; sem data ao final.
  out.sort((a, b) => {
    const am = a.date?.toMillis?.() ?? -1
    const bm = b.date?.toMillis?.() ?? -1
    if (am === -1 && bm === -1) return 0
    if (am === -1) return 1
    if (bm === -1) return -1
    return bm - am
  })

  return out.slice(0, 25)
}
