/**
 * Tema dinâmico: gera a paleta `pitch` (50→950) a partir de UMA cor base
 * e aplica nas CSS variables, deixando toda a UI (bg-pitch-*, text-pitch-*)
 * responder em runtime. A luminosidade de cada degrau é FIXA (não usa a
 * luminosidade da cor escolhida) — assim 600/700 ficam sempre escuros o
 * suficiente para texto branco, qualquer que seja a cor do time.
 */

/** Degraus da escala e sua luminosidade-alvo (0–100). */
const STEPS: Record<string, number> = {
  '50': 97,
  '100': 93,
  '200': 85,
  '300': 75,
  '400': 64,
  '500': 55,
  '600': 46,
  '700': 38,
  '800': 31,
  '900': 25,
  '950': 14,
}

export function isValidHexColor(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

/** RGB (0–255) → HSL com h em [0,360), s/l em [0,1]. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

/** HSL (h em graus, s/l em [0,1]) → RGB (0–255). */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

/** Mapa degrau → "R G B" (formato das CSS variables). */
export function generateScale(hex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(hex)
  const [h, s] = rgbToHsl(r, g, b)
  const out: Record<string, string> = {}
  for (const [step, lightness] of Object.entries(STEPS)) {
    const [rr, gg, bb] = hslToRgb(h, s, lightness / 100)
    out[step] = `${rr} ${gg} ${bb}`
  }
  return out
}

/** Aplica a cor do time nas CSS variables do documento. */
export function applyTeamTheme(hex: string): void {
  if (!isValidHexColor(hex)) return
  const scale = generateScale(hex)
  for (const [step, value] of Object.entries(scale)) {
    document.documentElement.style.setProperty(`--pitch-${step}`, value)
  }
}

/** Remove o override → volta ao verde padrão definido no :root. */
export function clearTeamTheme(): void {
  for (const step of Object.keys(STEPS)) {
    document.documentElement.style.removeProperty(`--pitch-${step}`)
  }
}
