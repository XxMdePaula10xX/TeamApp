/**
 * Helpers de referências do Firestore — centraliza os caminhos das
 * coleções/documentos para evitar strings soltas pelo código.
 */
import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const usersCol = () => collection(db, 'users')
export const userRef = (uid: string): DocumentReference => doc(db, 'users', uid)

export const teamsCol = (): CollectionReference => collection(db, 'teams')
export const teamRef = (teamId: string): DocumentReference => doc(db, 'teams', teamId)

export const playersCol = (teamId: string): CollectionReference =>
  collection(db, 'teams', teamId, 'players')
export const playerRef = (teamId: string, playerId: string): DocumentReference =>
  doc(db, 'teams', teamId, 'players', playerId)

export const gamesCol = (teamId: string): CollectionReference =>
  collection(db, 'teams', teamId, 'games')
export const gameRef = (teamId: string, gameId: string): DocumentReference =>
  doc(db, 'teams', teamId, 'games', gameId)

export const competitionsCol = (teamId: string): CollectionReference =>
  collection(db, 'teams', teamId, 'competitions')
export const competitionRef = (teamId: string, competitionId: string): DocumentReference =>
  doc(db, 'teams', teamId, 'competitions', competitionId)

/** Gera um id novo para um documento que ainda não existe (uso em batches). */
export const newId = (col: CollectionReference): string => doc(col).id
