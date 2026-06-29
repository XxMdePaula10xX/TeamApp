/** Contexto fornecido por TeamLayout às abas via <Outlet context>. */
import { useOutletContext } from 'react-router-dom'
import type { Team } from '@/types/models'

export interface TeamOutletContext {
  team: Team
  isOwner: boolean
}

export const useTeamOutlet = () => useOutletContext<TeamOutletContext>()
