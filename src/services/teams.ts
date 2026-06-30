/**
 * CRUD de times. `normalizedName` é SEMPRE derivado de `name` aqui (nunca
 * aceito do caller) — garante a busca por prefixo do Sprint 3 sem backfill.
 */
import {
  deleteDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { normalizeName, PREFIX_HIGH } from '@/utils/normalize'
import { EMPTY_TEAM_STATS } from '@/utils/stats'
import type { JerseyPattern, Team, TeamDoc } from '@/types/models'
import { competitionsCol, gamesCol, newId, playersCol, teamRef, teamsCol } from './paths'

const SEARCH_LIMIT = 20
export const SEARCH_MIN_LENGTH = 2

export interface TeamInput {
  name: string
  foundedAt: Timestamp | null
  /** URL já enviada ao Storage (ou '' / a atual ao editar sem trocar). */
  logoURL: string
  /** Cor primária do time (hex) ou null = cor padrão do app. */
  primaryColor: string | null
  /** Cor secundária do uniforme (hex) ou null. */
  secondaryColor: string | null
  /** Padrão do uniforme/escudo. */
  pattern: JerseyPattern
  /** Cidade "Cidade - UF" (da lista) ou null. */
  city: string | null
  /** Telefone de contato (amistosos/treinos) ou null. */
  phone: string | null
}

/**
 * Busca times por prefixo do nome normalizado (PRD §6/§7.7). Leitura
 * pública — funciona inclusive para anônimos. Retorna [] para termos
 * curtos demais.
 */
export async function searchTeams(term: string): Promise<Team[]> {
  const normalized = normalizeName(term)
  if (normalized.length < SEARCH_MIN_LENGTH) return []
  const q = query(
    teamsCol(),
    where('normalizedName', '>=', normalized),
    where('normalizedName', '<=', normalized + PREFIX_HIGH),
    orderBy('normalizedName'),
    limit(SEARCH_LIMIT),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeamDoc) }))
}

export async function createTeam(ownerId: string, input: TeamInput): Promise<string> {
  const id = newId(teamsCol())
  await setDoc(teamRef(id), {
    name: input.name.trim(),
    normalizedName: normalizeName(input.name),
    logoURL: input.logoURL,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    pattern: input.pattern,
    city: input.city,
    phone: input.phone,
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
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    pattern: input.pattern,
    city: input.city,
    phone: input.phone,
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
