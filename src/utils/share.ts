/**
 * Compartilhamento de links públicos (deep links).
 *
 * A base do link vem de `VITE_PUBLIC_BASE_URL` quando definida (ex.: o
 * domínio do Firebase Hosting) — necessário no app nativo, onde
 * `window.location.origin` é um host local não compartilhável. Na web,
 * cai para a origem atual.
 */
export function publicBaseUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_BASE_URL
  if (configured) return configured.replace(/\/$/, '')
  return window.location.origin
}

export function publicTeamUrl(teamId: string): string {
  // No GitHub Pages (hash router) os links públicos precisam do `#`.
  const hash = import.meta.env.VITE_ROUTER === 'hash' ? '/#' : ''
  return `${publicBaseUrl()}${hash}/time/${teamId}`
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** Usa a Web Share API quando disponível; senão copia para a área de transferência. */
export async function shareLink(title: string, url: string): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch (err) {
      // Usuário cancelou o diálogo nativo → não é erro.
      return err instanceof Error && err.name === 'AbortError' ? 'cancelled' : 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
