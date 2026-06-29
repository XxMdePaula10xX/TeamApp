/** Hook de leitura do elenco. */
import { useMemo } from 'react'
import { query } from 'firebase/firestore'
import type { PlayerDoc, WithId } from '@/types/models'
import { playersCol } from '@/services/paths'
import { useQueryData } from './useFirestore'

/** Ordena por nº de camisa (sem nº por último) e depois por nome. */
function byShirtThenName(a: WithId<PlayerDoc>, b: WithId<PlayerDoc>): number {
  const sa = a.shirtNumber ?? Number.POSITIVE_INFINITY
  const sb = b.shirtNumber ?? Number.POSITIVE_INFINITY
  if (sa !== sb) return sa - sb
  return a.name.localeCompare(b.name, 'pt-BR')
}

export function usePlayers(teamId: string | undefined) {
  const { data, loading, error } = useQueryData<PlayerDoc>(
    () => (teamId ? query(playersCol(teamId)) : null),
    [teamId],
  )
  const players = useMemo(() => (data ? [...data].sort(byShirtThenName) : data), [data])
  const activePlayers = useMemo(() => players?.filter((p) => p.active), [players])
  return { players, activePlayers, loading, error }
}
