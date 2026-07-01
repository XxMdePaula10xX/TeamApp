/**
 * Gera um id único para uso local (ex.: chaves de itens em formulários).
 *
 * Usa `crypto.randomUUID()` quando disponível, mas cai num fallback quando
 * não — o WKWebView de iOS < 15.4 (o app tem alvo iOS 13) NÃO expõe
 * `randomUUID`, e chamá-lo direto derrubaria a tela. Estes ids são apenas
 * chaves efêmeras de UI (não são persistidos), então o fallback basta.
 */
export function uid(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}
