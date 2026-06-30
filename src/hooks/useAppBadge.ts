/**
 * Badge no ícone do app (PWA/instalado) via navigator.setAppBadge.
 * Espelha a contagem de não-lidas e limpa quando o usuário ENTRA no app
 * (volta o foco). Em navegadores sem suporte, é um no-op silencioso.
 */
import { useEffect } from 'react'

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

export function useAppBadge(count: number): void {
  useEffect(() => {
    const nav = navigator as BadgeNavigator
    if (!nav.setAppBadge) return
    if (count > 0) nav.setAppBadge(count).catch(() => {})
    else nav.clearAppBadge?.().catch(() => {})
  }, [count])

  useEffect(() => {
    const nav = navigator as BadgeNavigator
    if (!nav.clearAppBadge) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') nav.clearAppBadge?.().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
}
