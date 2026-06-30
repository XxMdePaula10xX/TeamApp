/**
 * Conquistas/medalhas por jogador, derivadas dos agregados + jogos.
 * Tudo calculado no client (sem armazenamento extra).
 */
import type { Game, Player, TeamStats } from '@/types/models'

export interface Badge {
  id: string
  emoji: string
  label: string
}

/** Detecta quem fez 3+ gols em um mesmo jogo (hat-trick). */
function hatTrickPlayers(games: Game[]): Set<string> {
  const set = new Set<string>()
  for (const g of games) {
    const perPlayer = new Map<string, number>()
    for (const e of g.events) {
      if (e.type === 'GOL' && e.playerId) perPlayer.set(e.playerId, (perPlayer.get(e.playerId) ?? 0) + 1)
    }
    for (const [pid, n] of perPlayer) if (n >= 3) set.add(pid)
  }
  return set
}

export function computeAchievements(
  players: Player[],
  teamStats: TeamStats,
  games: Game[],
): Map<string, Badge[]> {
  const goals = players.map((p) => p.stats.goals)
  const assists = players.map((p) => p.stats.assists)
  const maxGoals = goals.length ? Math.max(...goals) : 0
  const maxAssists = assists.length ? Math.max(...assists) : 0
  const hat = hatTrickPlayers(games)
  const played = Math.max(0, teamStats.played)

  const map = new Map<string, Badge[]>()
  for (const p of players) {
    const s = p.stats
    const badges: Badge[] = []
    if (s.goals > 0 && s.goals === maxGoals) badges.push({ id: 'artilheiro', emoji: '🥇', label: 'Artilheiro' })
    if (s.assists > 0 && s.assists === maxAssists) badges.push({ id: 'garcom', emoji: '🅰️', label: 'Garçom' })
    if (hat.has(p.id)) badges.push({ id: 'hattrick', emoji: '🎩', label: 'Hat-trick' })
    if (s.goals >= 10) badges.push({ id: 'goleador', emoji: '💥', label: 'Goleador (10+ gols)' })
    if (s.assists >= 10) badges.push({ id: 'maestro', emoji: '🎼', label: 'Maestro (10+ assist.)' })
    if (s.gamesPlayed >= 50) badges.push({ id: 'veterano', emoji: '🎖️', label: 'Veterano (50+ jogos)' })
    if (played > 0 && s.gamesPlayed >= played) badges.push({ id: 'presenca', emoji: '📌', label: 'Presença total' })
    map.set(p.id, badges)
  }
  return map
}
