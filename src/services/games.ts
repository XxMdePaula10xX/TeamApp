/**
 * CRUD de jogos + recálculo de agregados.
 *
 * Tudo de um jogo (doc do jogo + competição nova opcional + increments de
 * team.stats e de cada player.stats afetado) vai em UM ÚNICO writeBatch,
 * que é atômico tanto na fila offline quanto no commit do servidor. Os
 * agregados usam dot-notation + increment (services/aggregates.ts).
 *
 * Edição usa diffs líquidos (novo − velho) sobre a união dos jogadores;
 * exclusão reverte (sinal negativo). Validação acontece ANTES do batch.
 */
import {
  getDocs,
  serverTimestamp,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  GameDoc,
  GameEvent,
  GameType,
  HomeAway,
  Player,
  PlayerStats,
} from '@/types/models'
import {
  EMPTY_PLAYER_STATS,
  EMPTY_TEAM_STATS,
  applyPlayerStats,
  applyTeamStats,
  computeResult,
  diffPlayerDeltas,
  diffTeamDelta,
  effectivePresence,
  negatePlayerDeltas,
  negateTeam,
  playerDeltas,
  teamDelta,
  validateGameScore,
  type GameStatsInput,
} from '@/utils/stats'
import {
  competitionRef,
  competitionsCol,
  gameRef,
  gamesCol,
  newId,
  playerRef,
  playersCol,
  teamRef,
} from './paths'
import { isEmptyUpdate, playerStatsIncrement, teamStatsIncrement } from './aggregates'
import { buildCompetitionData } from './competitions'

const BATCH_LIMIT = 450

/** Dados vindos do formulário de jogo. */
export interface GameInput {
  opponent: string
  date: Timestamp
  type: GameType
  homeAway: HomeAway | null
  scoreFor: number
  scoreAgainst: number
  presentPlayerIds: string[]
  events: GameEvent[]
  /** Competição existente (CAMPEONATO). */
  competitionId: string | null
  /** Nome de uma competição nova a criar no mesmo batch (CAMPEONATO). */
  newCompetitionName: string | null
}

export class GameValidationError extends Error {}

function toStatsInput(input: {
  scoreFor: number
  scoreAgainst: number
  presentPlayerIds: string[]
  events: GameEvent[]
}): GameStatsInput {
  return {
    scoreFor: input.scoreFor,
    scoreAgainst: input.scoreAgainst,
    presentPlayerIds: input.presentPlayerIds,
    events: input.events,
  }
}

/** Valida coerência aritmética/referencial antes de montar o batch. */
function assertValidGame(input: GameInput, validPlayerIds: Set<string>): void {
  if (!Number.isInteger(input.scoreFor) || input.scoreFor < 0)
    throw new GameValidationError('Placar a favor inválido.')
  if (!Number.isInteger(input.scoreAgainst) || input.scoreAgainst < 0)
    throw new GameValidationError('Placar contra inválido.')
  if (!input.opponent.trim()) throw new GameValidationError('Informe o adversário.')

  if (input.type === 'CAMPEONATO') {
    if (!input.competitionId && !input.newCompetitionName?.trim())
      throw new GameValidationError('Escolha ou crie uma competição.')
  }

  for (const e of input.events) {
    if (e.type !== 'GOL')
      throw new GameValidationError('Apenas eventos de gol são suportados.')
    if (e.playerId !== null && !validPlayerIds.has(e.playerId))
      throw new GameValidationError('Autor de gol inexistente no elenco.')
    if (e.assistPlayerId !== null) {
      if (e.playerId === null)
        throw new GameValidationError('Gol não-atribuído não pode ter assistência.')
      if (!validPlayerIds.has(e.assistPlayerId))
        throw new GameValidationError('Assistente inexistente no elenco.')
      if (e.assistPlayerId === e.playerId)
        throw new GameValidationError('Autor e assistente não podem ser a mesma pessoa.')
    }
  }

  const score = validateGameScore({ scoreFor: input.scoreFor, events: input.events })
  if (!score.valid) throw new GameValidationError(score.message ?? 'Placar incoerente.')
}

/** Adiciona ao batch o increment de cada player delta que exista no elenco. */
function applyPlayerIncrements(
  batch: ReturnType<typeof writeBatch>,
  teamId: string,
  deltas: Map<string, PlayerStats>,
  validPlayerIds: Set<string>,
): void {
  for (const [playerId, delta] of deltas) {
    if (!validPlayerIds.has(playerId)) continue // jogador removido: ignora (raro)
    const update = playerStatsIncrement(delta)
    if (!isEmptyUpdate(update)) batch.update(playerRef(teamId, playerId), update)
  }
}

export async function createGame(
  teamId: string,
  ownerId: string,
  input: GameInput,
  players: Player[],
): Promise<string> {
  const validPlayerIds = new Set(players.map((p) => p.id))
  assertValidGame(input, validPlayerIds)

  const batch = writeBatch(db)

  // Competição nova (mesmo batch).
  let competitionId = input.type === 'CAMPEONATO' ? input.competitionId : null
  if (input.type === 'CAMPEONATO' && input.newCompetitionName?.trim()) {
    competitionId = newId(competitionsCol(teamId))
    batch.set(competitionRef(teamId, competitionId), buildCompetitionData(ownerId, input.newCompetitionName))
  }

  const statsInput = toStatsInput(input)
  const present = effectivePresence(statsInput)
  const result = computeResult(input.scoreFor, input.scoreAgainst)
  const gameId = newId(gamesCol(teamId))

  batch.set(gameRef(teamId, gameId), {
    opponent: input.opponent.trim(),
    date: input.date,
    type: input.type,
    competitionId,
    homeAway: input.homeAway,
    scoreFor: input.scoreFor,
    scoreAgainst: input.scoreAgainst,
    result,
    presentPlayerIds: present,
    events: input.events,
    ownerId,
    createdAt: serverTimestamp(),
  })

  const teamInc = teamStatsIncrement(teamDelta(statsInput))
  if (!isEmptyUpdate(teamInc)) batch.update(teamRef(teamId), teamInc)
  applyPlayerIncrements(batch, teamId, playerDeltas(statsInput), validPlayerIds)

  await batch.commit()
  return gameId
}

export async function updateGame(
  teamId: string,
  gameId: string,
  oldGame: GameDoc,
  input: GameInput,
  players: Player[],
): Promise<void> {
  const validPlayerIds = new Set(players.map((p) => p.id))
  assertValidGame(input, validPlayerIds)

  const batch = writeBatch(db)

  let competitionId = input.type === 'CAMPEONATO' ? input.competitionId : null
  if (input.type === 'CAMPEONATO' && input.newCompetitionName?.trim()) {
    competitionId = newId(competitionsCol(teamId))
    batch.set(
      competitionRef(teamId, competitionId),
      buildCompetitionData(oldGame.ownerId, input.newCompetitionName),
    )
  }

  const oldInput = toStatsInput(oldGame)
  const newStatsInput = toStatsInput(input)
  const present = effectivePresence(newStatsInput)
  const result = computeResult(input.scoreFor, input.scoreAgainst)

  // ownerId e createdAt são imutáveis — não vão no update.
  batch.update(gameRef(teamId, gameId), {
    opponent: input.opponent.trim(),
    date: input.date,
    type: input.type,
    competitionId,
    homeAway: input.homeAway,
    scoreFor: input.scoreFor,
    scoreAgainst: input.scoreAgainst,
    result,
    presentPlayerIds: present,
    events: input.events,
  })

  const teamInc = teamStatsIncrement(diffTeamDelta(oldInput, newStatsInput))
  if (!isEmptyUpdate(teamInc)) batch.update(teamRef(teamId), teamInc)
  applyPlayerIncrements(batch, teamId, diffPlayerDeltas(oldInput, newStatsInput), validPlayerIds)

  await batch.commit()
}

export async function deleteGame(
  teamId: string,
  gameId: string,
  game: GameDoc,
  players: Player[],
): Promise<void> {
  const validPlayerIds = new Set(players.map((p) => p.id))
  const statsInput = toStatsInput(game)

  const batch = writeBatch(db)
  batch.delete(gameRef(teamId, gameId))

  const teamInc = teamStatsIncrement(negateTeam(teamDelta(statsInput)))
  if (!isEmptyUpdate(teamInc)) batch.update(teamRef(teamId), teamInc)
  applyPlayerIncrements(batch, teamId, negatePlayerDeltas(playerDeltas(statsInput)), validPlayerIds)

  await batch.commit()
}

/**
 * Recalcula do zero team.stats e player.stats somando TODOS os jogos.
 * Rede de segurança contra drift do denormalizado / edições concorrentes.
 * Requer conexão (lê todas as subcoleções). SUBSTITUI o objeto stats
 * inteiro (não usa increment).
 */
export async function recomputeTeamStats(teamId: string): Promise<void> {
  const [gamesSnap, playersSnap] = await Promise.all([
    getDocs(gamesCol(teamId)),
    getDocs(playersCol(teamId)),
  ])

  let team = { ...EMPTY_TEAM_STATS }
  const playerStats = new Map<string, PlayerStats>()
  for (const p of playersSnap.docs) playerStats.set(p.id, { ...EMPTY_PLAYER_STATS })

  for (const g of gamesSnap.docs) {
    const data = g.data() as GameDoc
    const input = toStatsInput(data)
    team = applyTeamStats(team, teamDelta(input), 1)
    for (const [pid, delta] of playerDeltas(input)) {
      if (!playerStats.has(pid)) continue
      playerStats.set(pid, applyPlayerStats(playerStats.get(pid)!, delta, 1))
    }
  }

  const ops: Array<{ ref: ReturnType<typeof teamRef>; data: object }> = [
    { ref: teamRef(teamId), data: { stats: team } },
  ]
  for (const [pid, stats] of playerStats) ops.push({ ref: playerRef(teamId, pid), data: { stats } })

  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const op of ops.slice(i, i + BATCH_LIMIT)) batch.update(op.ref, op.data)
    await batch.commit()
  }
}
