/**
 * Gráfico de barras horizontais por jogador (gols, assistências ou
 * frequência). Lazy-loaded.
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
}

export default function PlayerBars({
  data,
  color = '#16a34a',
  max,
}: {
  data: PlayerBar[]
  color?: string
  /** Domínio máximo do eixo (ex.: total de jogos p/ frequência). */
  max?: number
}) {
  // Altura proporcional ao nº de barras (mínimo confortável).
  const height = Math.max(120, data.length * 34 + 20)
  // Categoria do eixo é o id; rótulo exibido vem deste mapa.
  const labels = new Map(data.map((d) => [d.id, d.name]))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <XAxis type="number" hide domain={max ? [0, max] : undefined} />
        <YAxis
          type="category"
          dataKey="id"
          tickFormatter={(id: string) => labels.get(id) ?? id}
          width={96}
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
          interval={0}
        />
        <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [value, '']} labelFormatter={(id) => labels.get(id as string) ?? id} />
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
