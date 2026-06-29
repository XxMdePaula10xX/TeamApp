/**
 * Cálculo de agregados — funções puras (PRD §9).
 *
 * Estas funções NÃO tocam o Firestore: recebem dados simples e devolvem
 * deltas/resultados. O caminho de gravação (services/games.ts) converte
 * estes deltas em `writeBatch` + `FieldValue.increment()` (atômico e
 * offline-safe). Para edição/exclusão, usa-se `diffTeamDelta` /
 * `diffPlayerDeltas` (líquido novo − velho) sobre a UNIÃO dos jogadores.
 *
 * `applyTeamStats` / `applyPlayerStats` são read-modify-write e ficam
 * RESERVADAS ao recálculo total (`recomputeTeamStats`) — NUNCA usar no
 * caminho de increment.
 */
import {
  EMPTY_PLAYER_STATS,
  EMPTY_TEAM_STATS,
  type GameEvent,
  type GameResult,
  type PlayerStats,
  type TeamStats,
} from '@/types/models'

// ── Resultado da partida ─────────────────────────────────────

export function computeResult(scoreFor: number, scoreAgainst: number): GameResult {
  if (scoreFor > scoreAgainst) return 'VITORIA'
  if (scoreFor < scoreAgainst) return 'DERROTA'
  return 'EMPATE'
}

// ── Contribuição de um jogo ──────────────────────────────────

/** Dados mínimos de um jogo necessários para calcular agregados. */
export interface GameStatsInput {
  scoreFor: number
  scoreAgainst: number
  presentPlayerIds: string[]
  events: GameEvent[]
}

/** Quantos gols já têm autor atribuído (tipo GOL com playerId). */
export function countAttributedGoals(events: GameEvent[]): number {
  return events.filter((e) => e.type === 'GOL' && e.playerId !== null).length
}

/** Ids de jogadores citados nos eventos (autores de gol + assistentes). */
export function collectEventPlayerIds(events: GameEvent[]): string[] {
  const ids = new Set<string>()
  for (const e of events) {
    if (e.type === 'GOL' && e.playerId) ids.add(e.playerId)
    if (e.assistPlayerId) ids.add(e.assistPlayerId)
  }
  return [...ids]
}

/**
 * Presença EFETIVA: união da presença marcada com todos os jogadores
 * citados em eventos. Garante que um autor/assistente nunca fique com
 * goals/assists > 0 e gamesPlayed = 0. É esta lista que deve ser
 * persistida em `presentPlayerIds`.
 */
export function effectivePresence(input: GameStatsInput): string[] {
  return [...new Set([...input.presentPlayerIds, ...collectEventPlayerIds(input.events)])]
}

/**
 * Valida a coerência do placar (PRD §7.6.6): a soma dos gols atribuídos
 * não pode passar de `scoreFor`. O restante vira "não-atribuído".
 */
export function validateGameScore(input: Pick<GameStatsInput, 'scoreFor' | 'events'>): {
  valid: boolean
  attributed: number
  unattributed: number
  message?: string
} {
  const attributed = countAttributedGoals(input.events)
  const unattributed = input.scoreFor - attributed
  if (attributed > input.scoreFor) {
    return {
      valid: false,
      attributed,
      unattributed,
      message: `Você atribuiu ${attributed} gol(s), mas o placar a favor é ${input.scoreFor}.`,
    }
  }
  return { valid: true, attributed, unattributed }
}

/** Delta que um jogo aplica ao agregado do time. */
export function teamDelta(input: GameStatsInput): TeamStats {
  const result = computeResult(input.scoreFor, input.scoreAgainst)
  return {
    played: 1,
    wins: result === 'VITORIA' ? 1 : 0,
    draws: result === 'EMPATE' ? 1 : 0,
    losses: result === 'DERROTA' ? 1 : 0,
    goalsFor: input.scoreFor,
    goalsAgainst: input.scoreAgainst,
  }
}

/**
 * Delta por jogador (goals/assists/gamesPlayed) que um jogo aplica.
 * - `gamesPlayed`: cada id da PRESENÇA EFETIVA (presença ∪ citados).
 * - `goals`: eventos GOL com `playerId`.
 * - `assists`: SOMENTE `assistPlayerId` (representação canônica do MVP —
 *   evita o double-count entre evento ASSIST e assistPlayerId).
 */
export function playerDeltas(input: GameStatsInput): Map<string, PlayerStats> {
  const deltas = new Map<string, PlayerStats>()

  const bump = (playerId: string, field: keyof PlayerStats, amount = 1) => {
    const current = deltas.get(playerId) ?? { ...EMPTY_PLAYER_STATS }
    current[field] += amount
    deltas.set(playerId, current)
  }

  for (const id of effectivePresence(input)) bump(id, 'gamesPlayed')

  for (const event of input.events) {
    if (event.type === 'GOL' && event.playerId) bump(event.playerId, 'goals')
    if (event.assistPlayerId) bump(event.assistPlayerId, 'assists')
  }

  return deltas
}

// ── Diffs para edição/exclusão (líquido novo − velho) ────────

const subtractTeam = (a: TeamStats, b: TeamStats): TeamStats => ({
  played: a.played - b.played,
  wins: a.wins - b.wins,
  draws: a.draws - b.draws,
  losses: a.losses - b.losses,
  goalsFor: a.goalsFor - b.goalsFor,
  goalsAgainst: a.goalsAgainst - b.goalsAgainst,
})

const subtractPlayer = (a: PlayerStats, b: PlayerStats): PlayerStats => ({
  goals: a.goals - b.goals,
  assists: a.assists - b.assists,
  gamesPlayed: a.gamesPlayed - b.gamesPlayed,
  yellowCards: a.yellowCards - b.yellowCards,
  redCards: a.redCards - b.redCards,
})

const isZeroPlayer = (s: PlayerStats): boolean =>
  s.goals === 0 && s.assists === 0 && s.gamesPlayed === 0 && s.yellowCards === 0 && s.redCards === 0

/** Delta líquido do time ao trocar um jogo antigo por um novo. */
export function diffTeamDelta(oldInput: GameStatsInput, newInput: GameStatsInput): TeamStats {
  return subtractTeam(teamDelta(newInput), teamDelta(oldInput))
}

/**
 * Delta líquido por jogador ao editar um jogo, sobre a UNIÃO dos ids
 * (quem saiu recebe increment negativo). Entradas totalmente zeradas
 * são omitidas para não tocar jogadores não-afetados.
 */
export function diffPlayerDeltas(
  oldInput: GameStatsInput,
  newInput: GameStatsInput,
): Map<string, PlayerStats> {
  const oldMap = playerDeltas(oldInput)
  const newMap = playerDeltas(newInput)
  const ids = new Set([...oldMap.keys(), ...newMap.keys()])
  const result = new Map<string, PlayerStats>()
  for (const id of ids) {
    const net = subtractPlayer(
      newMap.get(id) ?? EMPTY_PLAYER_STATS,
      oldMap.get(id) ?? EMPTY_PLAYER_STATS,
    )
    if (!isZeroPlayer(net)) result.set(id, net)
  }
  return result
}

/** Delta de reversão (sinal negativo) de um jogo — usado na exclusão. */
export function negateTeam(delta: TeamStats): TeamStats {
  return subtractTeam(EMPTY_TEAM_STATS, delta)
}

export function negatePlayerDeltas(map: Map<string, PlayerStats>): Map<string, PlayerStats> {
  const out = new Map<string, PlayerStats>()
  for (const [id, s] of map) out.set(id, subtractPlayer(EMPTY_PLAYER_STATS, s))
  return out
}

// ── Recálculo total (read-modify-write; fora do caminho increment) ──

/** Soma `delta * sign` em cada campo de um TeamStats. `sign` é +1 ou -1. */
export function applyTeamStats(base: TeamStats, delta: TeamStats, sign: 1 | -1): TeamStats {
  return {
    played: base.played + delta.played * sign,
    wins: base.wins + delta.wins * sign,
    draws: base.draws + delta.draws * sign,
    losses: base.losses + delta.losses * sign,
    goalsFor: base.goalsFor + delta.goalsFor * sign,
    goalsAgainst: base.goalsAgainst + delta.goalsAgainst * sign,
  }
}

/** Soma `delta * sign` em cada campo de um PlayerStats. */
export function applyPlayerStats(base: PlayerStats, delta: PlayerStats, sign: 1 | -1): PlayerStats {
  return {
    goals: base.goals + delta.goals * sign,
    assists: base.assists + delta.assists * sign,
    gamesPlayed: base.gamesPlayed + delta.gamesPlayed * sign,
    yellowCards: base.yellowCards + delta.yellowCards * sign,
    redCards: base.redCards + delta.redCards * sign,
  }
}

// ── Derivados/sanitização de LEITURA (clamp aqui, nunca na escrita) ──

/** Clampa stats do time para exibição (defesa contra drift do denormalizado). */
export function clampTeamStats(stats: TeamStats): TeamStats {
  return {
    played: Math.max(0, stats.played),
    wins: Math.max(0, stats.wins),
    draws: Math.max(0, stats.draws),
    losses: Math.max(0, stats.losses),
    goalsFor: Math.max(0, stats.goalsFor),
    goalsAgainst: Math.max(0, stats.goalsAgainst),
  }
}

export function clampPlayerStats(stats: PlayerStats): PlayerStats {
  return {
    goals: Math.max(0, stats.goals),
    assists: Math.max(0, stats.assists),
    gamesPlayed: Math.max(0, stats.gamesPlayed),
    yellowCards: Math.max(0, stats.yellowCards),
    redCards: Math.max(0, stats.redCards),
  }
}

export function goalDifference(stats: TeamStats): number {
  return stats.goalsFor - stats.goalsAgainst
}

/** Aproveitamento em % (3 pts vitória, 1 empate) sobre o total possível. */
export function winPercentage(stats: TeamStats): number {
  const played = Math.max(0, stats.played)
  if (played <= 0) return 0
  const points = Math.max(0, stats.wins * 3 + stats.draws)
  return Math.min(100, Math.round((points / (played * 3)) * 100))
}

export { EMPTY_TEAM_STATS, EMPTY_PLAYER_STATS }
