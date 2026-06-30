/**
 * Escudo/uniforme do time em SVG: cor primária + secundária + padrão
 * (liso, listras verticais, horizontais ou faixa diagonal).
 */
import { useId } from 'react'
import type { JerseyPattern } from '@/types/models'

const SHIRT =
  'M24 6 L28 4 C30 6 34 6 36 4 L40 6 L58 14 L52 28 L46 25 L46 60 L18 60 L18 25 L12 28 L6 14 Z'

export function Jersey({
  primary,
  secondary,
  pattern = 'SOLID',
  size = 44,
}: {
  primary: string
  secondary?: string | null
  pattern?: JerseyPattern
  size?: number
}) {
  const uid = useId().replace(/[:]/g, '')
  const clip = `jersey-clip-${uid}`
  const sec = secondary || '#ffffff'

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Uniforme do time">
      <defs>
        <clipPath id={clip}>
          <path d={SHIRT} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="64" height="64" fill={primary} />
        {pattern === 'STRIPES' &&
          [8, 24, 40, 56].map((x) => <rect key={x} x={x} y="0" width="8" height="64" fill={sec} />)}
        {pattern === 'HOOPS' &&
          [8, 24, 40, 56].map((y) => <rect key={y} x="0" y={y} width="64" height="8" fill={sec} />)}
        {pattern === 'SASH' && (
          <rect x="-20" y="26" width="120" height="12" fill={sec} transform="rotate(-45 32 32)" />
        )}
      </g>
      <path d={SHIRT} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
    </svg>
  )
}
