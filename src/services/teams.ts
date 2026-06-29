/**
 * CRUD de times. `normalizedName` é SEMPRE derivado de `name` aqui (nunca
 * aceito do caller) — garante a busca por prefixo do Sprint 3 sem backfill.
 */
import {
  deleteDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { normalizeName } from '@/utils/normalize'
import { EMPTY_TEAM_STATS } from '@/utils/stats'
import { competitionsCol, gamesCol, newId, playersCol, teamRef, teamsCol } from './paths'

export interface TeamInput {
  name: string
  foundedAt: Timestamp | null
  /** URL já enviada ao Storage (ou '' / a atual ao editar sem trocar). */
  logoURL: string
}

export async function createTeam(ownerId: string, input: TeamInput): Promise<string> {
  const id = newId(teamsCol())
  await setDoc(teamRef(id), {
    name: input.name.trim(),
    normalizedName: normalizeName(input.name),
    logoURL: input.logoURL,
    foundedAt: input.foundedAt,
    ownerId,
    createdAt: serverTimestamp(),
    stats: EMPTY_TEAM_STATS,
  })
  return id
}

export async function updateTeam(teamId: string, input: TeamInput): Promise<void> {
  await updateDoc(teamRef(teamId), {
    name: input.name.trim(),
    normalizedName: normalizeName(input.name),
    logoURL: input.logoURL,
    foundedAt: input.foundedAt,
  })
}

const BATCH_LIMIT = 450 // margem sob o limite de 500 ops do Firestore

/**
 * Exclui o time e cascateia subcoleções (players/games/competitions) em
 * lotes. Requer CONEXÃO (enumera subcoleções). Observação: fotos no
 * Storage não são removidas aqui — dívida conhecida do MVP.
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const subcols = [playersCol(teamId), gamesCol(teamId), competitionsCol(teamId)]
  for (const col of subcols) {
    const snap = await getDocs(col)
    for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db)
      for (const docSnap of snap.docs.slice(i, i + BATCH_LIMIT)) batch.delete(docSnap.ref)
      await batch.commit()
    }
  }
  await deleteDoc(teamRef(teamId))
}
