/**
 * CRUD de jogadores. Remoção é SOFT-DELETE (active=false) para preservar
 * stats históricas e a integridade da reversão de agregados (jogos
 * referenciam playerIds). Hard-delete só acontece no cascade do time.
 */
import { serverTimestamp, setDoc, updateDoc, type Timestamp } from 'firebase/firestore'
import { EMPTY_PLAYER_STATS } from '@/utils/stats'
import type { Position, PreferredFoot } from '@/types/models'
import { newId, playerRef, playersCol } from './paths'

export interface PlayerInput {
  name: string
  nickname: string | null
  shirtNumber: number | null
  position: Position
  preferredFoot: PreferredFoot
  joinedAt: Timestamp | null
  photoURL: string
  active: boolean
}

export async function addPlayer(
  teamId: string,
  ownerId: string,
  input: PlayerInput,
): Promise<string> {
  const id = newId(playersCol(teamId))
  await setDoc(playerRef(teamId, id), {
    name: input.name.trim(),
    nickname: input.nickname,
    photoURL: input.photoURL,
    shirtNumber: input.shirtNumber,
    position: input.position,
    preferredFoot: input.preferredFoot,
    joinedAt: input.joinedAt,
    active: input.active,
    ownerId,
    createdAt: serverTimestamp(),
    stats: EMPTY_PLAYER_STATS,
  })
  return id
}

export async function updatePlayer(
  teamId: string,
  playerId: string,
  input: PlayerInput,
): Promise<void> {
  await updateDoc(playerRef(teamId, playerId), {
    name: input.name.trim(),
    nickname: input.nickname,
    photoURL: input.photoURL,
    shirtNumber: input.shirtNumber,
    position: input.position,
    preferredFoot: input.preferredFoot,
    joinedAt: input.joinedAt,
    active: input.active,
  })
}

/** Soft-delete: tira o jogador do elenco ativo, preserva stats. */
export async function setPlayerActive(
  teamId: string,
  playerId: string,
  active: boolean,
): Promise<void> {
  await updateDoc(playerRef(teamId, playerId), { active })
}
