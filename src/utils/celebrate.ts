/**
 * Microinterações de comemoração (confete). Carregado sob demanda para não
 * pesar o bundle inicial. Respeita "prefers-reduced-motion".
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

/** Chuva de confete (ex.: ao registrar uma vitória). */
export async function celebrateWin(): Promise<void> {
  if (prefersReducedMotion()) return
  const { default: confetti } = await import('canvas-confetti')
  const colors = ['#16a34a', '#22c55e', '#86efac', '#ffffff']
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors })
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors }), 150)
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors }), 300)
}

/** Estouro pequeno e pontual (ex.: empate/feito concluído). */
export async function celebratePop(): Promise<void> {
  if (prefersReducedMotion()) return
  const { default: confetti } = await import('canvas-confetti')
  confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, colors: ['#16a34a', '#22c55e', '#ffffff'] })
}
