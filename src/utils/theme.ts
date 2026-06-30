/**
 * Tema dinâmico: gera a paleta `pitch` (50→950) a partir de UMA cor base
 * e aplica nas CSS variables, deixando toda a UI (bg-pitch-*, text-pitch-*)
 * responder em runtime.
 *
 * Cada degrau mira uma LUMINÂNCIA RELATIVA (WCAG), não a luminosidade HSL
 * — luminosidade HSL não corresponde ao brilho percebido (amarelo a 46% de
 * L é muito mais claro que azul a 46%). Mirando a luminância garantimos que
 * os tons escuros (600–950) fiquem escuros o bastante para TEXTO BRANCO
 * legível e os claros (50–200) para texto escuro, em qualquer matiz.
 */

/** Degraus e sua luminância relativa-alvo (0–1). Escolhidas para que branco
 *  sobre 600/700 passe no WCAG AA (~4.5:1) e preto/slate sobre 50–200 também. */
const STEPS: Record<string, number> = {
  '50': 0.92,
  '100': 0.82,
  '200': 0.68,
  '300': 0.5,
  '400': 0.33,
  '500': 0.22,
  '600': 0.15,
  '700': 0.1,
  '800': 0.065,
  '900': 0.04,
  '950': 0.018,
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

/** Luminância relativa WCAG (0–1) de um RGB 0–255. */
function relativeLuminance(r: number, g: number, b: number): number {
  const lin = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

/**
 * Acha a luminosidade HSL que produz a luminância relativa-alvo para um
 * dado matiz/saturação (luminância é monotônica em L). Busca binária.
 */
function lightnessForLuminance(h: number, s: number, target: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    const [r, g, b] = hslToRgb(h, s, mid)
    if (relativeLuminance(r, g, b) < target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** Mapa degrau → "R G B" (formato das CSS variables). */
export function generateScale(hex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(hex)
  const [h, s] = rgbToHsl(r, g, b)
  const out: Record<string, string> = {}
  for (const [step, targetLum] of Object.entries(STEPS)) {
    const l = lightnessForLuminance(h, s, targetLum)
    const [rr, gg, bb] = hslToRgb(h, s, l)
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
