/**
 * Preferência do usuário: usar as cores do time ou a cor padrão do app.
 * Persistida em localStorage (decisão de visualização, não precisa ir ao
 * Firestore). Default: usar as cores do time quando o time tiver uma.
 */
import { create } from 'zustand'

const KEY = 'pm:use-team-colors'

function loadPref(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'false'
  } catch {
    return true
  }
}

function savePref(value: boolean): void {
  try {
    localStorage.setItem(KEY, String(value))
  } catch {
    /* ignora (modo privado etc.) */
  }
}

interface ThemeState {
  useTeamColors: boolean
  setUseTeamColors: (value: boolean) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  useTeamColors: loadPref(),
  setUseTeamColors: (value) => {
    savePref(value)
    set({ useTeamColors: value })
  },
  toggle: () => get().setUseTeamColors(!get().useTeamColors),
}))
