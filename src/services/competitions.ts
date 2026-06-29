/**
 * Competições (teams/{teamId}/competitions). Uma competição nova é criada
 * DENTRO do mesmo writeBatch do jogo (ver services/games.ts) para não
 * deixar competição órfã offline. Aqui ficam só helpers puros/de dado.
 */
import { serverTimestamp } from 'firebase/firestore'
import { normalizeName } from '@/utils/normalize'
import type { Competition } from '@/types/models'

/** Dados de um CompetitionDoc novo (para set dentro de um batch). */
export function buildCompetitionData(ownerId: string, name: string) {
  return {
    name: name.trim(),
    normalizedName: normalizeName(name),
    ownerId,
    createdAt: serverTimestamp(),
  }
}

/** Dedupe por nome normalizado contra a lista já carregada. */
export function findCompetitionByName(
  competitions: Competition[],
  name: string,
): Competition | undefined {
  const target = normalizeName(name)
  return competitions.find((c) => c.normalizedName === target)
}
