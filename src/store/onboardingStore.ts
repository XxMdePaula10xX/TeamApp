/**
 * Mini tutorial de boas-vindas. Abre automaticamente no primeiro acesso
 * (logado) e fica revisitável por um botão "?" no topo. O "já vi" é
 * persistido em localStorage.
 */
import { create } from 'zustand'

const KEY = 'pm:onboarding-seen'

function loadSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

interface OnboardingState {
  open: boolean
  seen: boolean
  openTutorial: () => void
  finish: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  open: false,
  seen: loadSeen(),
  openTutorial: () => set({ open: true }),
  finish: () => {
    try {
      localStorage.setItem(KEY, 'true')
    } catch {
      /* ignora */
    }
    set({ open: false, seen: true })
  },
}))
