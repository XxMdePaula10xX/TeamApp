/** Hooks de leitura de times. */
import { useMemo } from 'react'
import { query, where } from 'firebase/firestore'
import type { TeamDoc, WithId } from '@/types/models'
import { teamRef, teamsCol } from '@/services/paths'
import { useDocData, useQueryData } from './useFirestore'

const createdAtMillis = (t: WithId<TeamDoc>) => t.createdAt?.toMillis?.() ?? 0

/** Times administrados pelo usuário, ordenados por criação (cliente). */
export function useMyTeams(uid: string | undefined) {
  const { data, loading, error } = useQueryData<TeamDoc>(
    () => (uid ? query(teamsCol(), where('ownerId', '==', uid)) : null),
    [uid],
  )
  const teams = useMemo(
    () => (data ? [...data].sort((a, b) => createdAtMillis(b) - createdAtMillis(a)) : data),
    [data],
  )
  return { teams, loading, error }
}

/** Um time pelo id (modo leitura público). */
export function useTeam(teamId: string | undefined) {
  const { data, loading, error } = useDocData<TeamDoc>(
    () => (teamId ? teamRef(teamId) : null),
    [teamId],
  )
  return { team: data, loading, error }
}
