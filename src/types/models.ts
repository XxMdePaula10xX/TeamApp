/**
 * Modelo de dados — Pelada Manager (Firestore).
 *
 * Reflete a estrutura de coleções do PRD §6. Documentos são
 * desnormalizados (agregados embutidos) para leitura pública barata.
 *
 * Convenção: `Timestamp` do Firestore é usado na persistência; na
 * camada de UI normalmente convertemos para `Date`. Os tipos abaixo
 * descrevem o formato persistido.
 */
import type { Timestamp } from 'firebase/firestore'

// ── Enums ────────────────────────────────────────────────────

export type Position = 'GOL' | 'ZAG' | 'LAT' | 'VOL' | 'MEI' | 'ATA'

export const POSITIONS: readonly Position[] = ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA']

export const POSITION_LABELS: Record<Position, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  VOL: 'Volante',
  MEI: 'Meia',
  ATA: 'Atacante',
}

export type PreferredFoot = 'DIREITO' | 'ESQUERDO' | 'AMBIDESTRO'

export const PREFERRED_FEET: readonly PreferredFoot[] = ['DIREITO', 'ESQUERDO', 'AMBIDESTRO']

export const PREFERRED_FOOT_LABELS: Record<PreferredFoot, string> = {
  DIREITO: 'Direito',
  ESQUERDO: 'Esquerdo',
  AMBIDESTRO: 'Ambidestro',
}

export type GameType = 'AMISTOSO' | 'CAMPEONATO'

export type HomeAway = 'CASA' | 'FORA'

export type GameResult = 'VITORIA' | 'EMPATE' | 'DERROTA'

export type GameEventType = 'GOL' | 'ASSIST'

// ── Agregados (denormalizados) ───────────────────────────────

export interface TeamStats {
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
}

export const EMPTY_TEAM_STATS: TeamStats = {
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
}

export interface PlayerStats {
  goals: number
  assists: number
  gamesPlayed: number
  yellowCards: number // reservado para evolução futura
  redCards: number // reservado para evolução futura
}

export const EMPTY_PLAYER_STATS: PlayerStats = {
  goals: 0,
  assists: 0,
  gamesPlayed: 0,
  yellowCards: 0,
  redCards: 0,
}

// ── Documentos ───────────────────────────────────────────────

export interface UserDoc {
  displayName: string
  email: string
  photoURL: string
  createdAt: Timestamp
}

export interface TeamDoc {
  name: string
  /** lowercase sem acento — usado em `where('normalizedName', '>=', termo)`. */
  normalizedName: string
  logoURL: string
  foundedAt: Timestamp | null
  ownerId: string
  createdAt: Timestamp
  stats: TeamStats
}

export interface PlayerDoc {
  name: string
  photoURL: string
  shirtNumber: number | null
  position: Position
  preferredFoot: PreferredFoot
  joinedAt: Timestamp | null
  active: boolean
  stats: PlayerStats
}

export interface CompetitionDoc {
  name: string
  createdAt: Timestamp
}

/**
 * Evento de um jogo. `playerId: null` representa gol contra/não-atribuído,
 * usado para fechar o placar sem obrigar a nomear o autor (PRD §6).
 */
export interface GameEvent {
  type: GameEventType
  playerId: string | null
  assistPlayerId: string | null
  minute: number | null
}

export interface GameDoc {
  opponent: string
  date: Timestamp
  type: GameType
  competitionId: string | null
  homeAway: HomeAway | null
  scoreFor: number
  scoreAgainst: number
  /** Calculado a partir do placar; persistido para facilitar filtros. */
  result: GameResult
  presentPlayerIds: string[]
  events: GameEvent[]
  createdAt: Timestamp
}

// ── Tipos "hidratados" com id (uso na UI) ────────────────────

export type WithId<T> = T & { id: string }

export type Team = WithId<TeamDoc>
export type Player = WithId<PlayerDoc>
export type Competition = WithId<CompetitionDoc>
export type Game = WithId<GameDoc>
