/**
 * Cálculo de agregados — funções puras (PRD §9).
 *
 * Estas funções NÃO tocam o Firestore: recebem dados simples e
 * devolvem deltas/resultados. No Sprint 1 elas serão chamadas dentro
 * de uma transação que aplica os deltas em `team.stats` e
 * `player.stats`. A chave para edição/exclusão sem inconsistência é:
 * REVERTER a contribuição antiga (sinal -1) e REAPLICAR a nova (+1).
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
 * - `gamesPlayed`: cada id em `presentPlayerIds`.
 * - `goals`: eventos GOL com `playerId`.
 * - `assists`: `assistPlayerId` de qualquer evento, mais `playerId`
 *   de eventos do tipo ASSIST (não usado no fluxo de cadastro do MVP,
 *   mas suportado para robustez).
 */
export function playerDeltas(input: GameStatsInput): Map<string, PlayerStats> {
  const deltas = new Map<string, PlayerStats>()

  const bump = (playerId: string, field: keyof PlayerStats, amount = 1) => {
    const current = deltas.get(playerId) ?? { ...EMPTY_PLAYER_STATS }
    current[field] += amount
    deltas.set(playerId, current)
  }

  for (const id of input.presentPlayerIds) bump(id, 'gamesPlayed')

  for (const event of input.events) {
    if (event.type === 'GOL' && event.playerId) bump(event.playerId, 'goals')
    if (event.type === 'ASSIST' && event.playerId) bump(event.playerId, 'assists')
    if (event.assistPlayerId) bump(event.assistPlayerId, 'assists')
  }

  return deltas
}

// ── Aplicação/reversão de deltas ─────────────────────────────

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

// ── Derivados de leitura ─────────────────────────────────────

export function goalDifference(stats: TeamStats): number {
  return stats.goalsFor - stats.goalsAgainst
}

/** Aproveitamento em % (3 pts vitória, 1 empate) sobre o total possível. */
export function winPercentage(stats: TeamStats): number {
  if (stats.played === 0) return 0
  const points = stats.wins * 3 + stats.draws
  return Math.round((points / (stats.played * 3)) * 100)
}

export { EMPTY_TEAM_STATS, EMPTY_PLAYER_STATS }
