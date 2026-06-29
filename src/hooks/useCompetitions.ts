/** Hook de leitura das competições do time (para o combobox do jogo). */
import { useMemo } from 'react'
import { query } from 'firebase/firestore'
import type { CompetitionDoc, WithId } from '@/types/models'
import { competitionsCol } from '@/services/paths'
import { useQueryData } from './useFirestore'

export function useCompetitions(teamId: string | undefined) {
  const { data, loading, error } = useQueryData<CompetitionDoc>(
    () => (teamId ? query(competitionsCol(teamId)) : null),
    [teamId],
  )
  const competitions = useMemo(
    () =>
      data
        ? [...data].sort((a: WithId<CompetitionDoc>, b: WithId<CompetitionDoc>) =>
            a.name.localeCompare(b.name, 'pt-BR'),
          )
        : data,
    [data],
  )
  return { competitions, loading, error }
}
