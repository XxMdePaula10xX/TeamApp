/**
 * Ownership ternário: {isOwner, ready}. Um booleano só colapsaria "ainda
 * não sei" em false e faria os botões do dono piscarem, porque há dois
 * fluxos assíncronos (auth inicializando + time carregando) que não
 * convergem no 1º render. CTAs de escrita só aparecem quando isOwner.
 */
import type { Team } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export function useIsOwner(team: Team | null | undefined, teamLoading: boolean) {
  const uid = useAuthStore((s) => s.user?.uid)
  const initializing = useAuthStore((s) => s.initializing)

  const ready = !initializing && !teamLoading && team !== undefined
  const isOwner = ready && !!uid && !!team && team.ownerId === uid
  return { isOwner, ready }
}
