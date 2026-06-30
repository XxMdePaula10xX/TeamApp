/**
 * Aplica a cor do time no tema do app enquanto a página do time está
 * montada — se o usuário optou por usar as cores do time e o time tiver
 * uma cor própria. Ao desmontar (sair da página) ou desligar a
 * preferência, reverte ao verde padrão.
 */
import { useEffect } from 'react'
import type { Team } from '@/types/models'
import { applyTeamTheme, clearTeamTheme } from '@/utils/theme'
import { useThemeStore } from '@/store/themeStore'

export function useTeamTheme(team: Team | null | undefined): void {
  const useTeamColors = useThemeStore((s) => s.useTeamColors)
  const color = team?.primaryColor ?? null

  useEffect(() => {
    if (useTeamColors && color) {
      applyTeamTheme(color)
    } else {
      clearTeamTheme()
    }
    return () => clearTeamTheme()
  }, [useTeamColors, color])
}
