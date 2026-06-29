/**
 * Evolução de pontos acumulados ao longo dos jogos (Recharts).
 * 3 pts por vitória, 1 por empate. Lazy-loaded.
 */
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface EvolutionPoint {
  label: string
  points: number
  opponent: string
}

export default function PointsEvolution({ data }: { data: EvolutionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="ptsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" width={28} />
        <Tooltip
          formatter={(value: number) => [`${value} pts`, 'Acumulado']}
          labelFormatter={(label, payload) =>
            payload?.[0] ? `${label} · ${payload[0].payload.opponent}` : label
          }
        />
        <Area
          type="monotone"
          dataKey="points"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#ptsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
