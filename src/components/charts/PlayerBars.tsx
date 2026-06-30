/**
 * Gráfico de barras horizontais por jogador (gols, assistências ou
 * frequência). Lazy-loaded. Opcionalmente exibe a FOTO do jogador no eixo
 * (showAvatars) — útil na artilharia.
 */
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface PlayerBar {
  /** Id estável do jogador — chave/categoria única (evita colisão de nome). */
  id: string
  name: string
  value: number
  /** Foto do jogador (opcional) para exibir no eixo. */
  photo?: string
}

interface TickPayload {
  value: string
}

export default function PlayerBars({
  data,
  color = '#16a34a',
  max,
  showAvatars = false,
}: {
  data: PlayerBar[]
  color?: string
  /** Domínio máximo do eixo (ex.: total de jogos p/ frequência). */
  max?: number
  /** Exibe avatar do jogador no eixo Y. */
  showAvatars?: boolean
}) {
  const rowH = showAvatars ? 40 : 34
  const height = Math.max(120, data.length * rowH + 20)
  const labels = new Map(data.map((d) => [d.id, d.name]))
  const photos = new Map(data.map((d) => [d.id, d.photo]))
  const axisWidth = showAvatars ? 130 : 96

  const renderTick = (props: { x?: number; y?: number; payload?: TickPayload }) => {
    const { x = 0, y = 0, payload } = props
    const id = payload?.value ?? ''
    const name = labels.get(id) ?? id
    const photo = photos.get(id)
    const initial = name.trim().charAt(0).toUpperCase() || '?'
    const w = axisWidth - 6
    return (
      <g transform={`translate(${x - axisWidth + 2}, ${y - 13})`}>
        <foreignObject width={w} height={26}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 26 }}>
            {photo ? (
              <img
                src={photo}
                alt=""
                style={{ width: 22, height: 22, borderRadius: '9999px', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '9999px',
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {initial}
              </span>
            )}
            <span
              style={{
                fontSize: 12,
                color: '#475569',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </span>
          </div>
        </foreignObject>
      </g>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <XAxis type="number" hide domain={max ? [0, max] : undefined} />
        <YAxis
          type="category"
          dataKey="id"
          width={axisWidth}
          interval={0}
          stroke="#94a3b8"
          tick={showAvatars ? renderTick : { fontSize: 12 }}
          tickFormatter={showAvatars ? undefined : (id: string) => labels.get(id) ?? id}
        />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          formatter={(value) => [value, '']}
          labelFormatter={(id) => labels.get(id as string) ?? id}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={color}>
          {data.map((d) => (
            <Cell key={d.id} fill={color} />
          ))}
          <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#475569' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
