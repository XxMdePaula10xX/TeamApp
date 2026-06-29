/** Hook de leitura de jogos (ordenados por data, com filtro de tipo). */
import { limit, orderBy, query, where } from 'firebase/firestore'
import type { GameType } from '@/types/models'
import type { GameDoc } from '@/types/models'
import { gameRef, gamesCol } from '@/services/paths'
import { useDocData, useQueryData } from './useFirestore'

export const GAMES_LIMIT = 100

/**
 * Jogos do time, mais recentes primeiro. `typeFilter` opcional filtra por
 * AMISTOSO/CAMPEONATO (usa o índice composto type+date). Ordena por `date`
 * (sempre presente) — nunca por createdAt (pode estar pendente offline).
 */
export function useGames(teamId: string | undefined, typeFilter?: GameType | null) {
  const { data, loading, error, pendingIds } = useQueryData<GameDoc>(
    () => {
      if (!teamId) return null
      const base = gamesCol(teamId)
      return typeFilter
        ? query(base, where('type', '==', typeFilter), orderBy('date', 'desc'), limit(GAMES_LIMIT))
        : query(base, orderBy('date', 'desc'), limit(GAMES_LIMIT))
    },
    [teamId, typeFilter],
  )
  return { games: data, loading, error, pendingIds }
}

/** Um jogo pelo id (para hidratar o editor). */
export function useGame(teamId: string | undefined, gameId: string | undefined) {
  const { data, loading, error } = useDocData<GameDoc>(
    () => (teamId && gameId ? gameRef(teamId, gameId) : null),
    [teamId, gameId],
  )
  return { game: data, loading, error }
}
