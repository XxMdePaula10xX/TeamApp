/**
 * Radar comparando dois jogadores (gols, assistências, jogos, G+A).
 * Lazy-loaded. Eixos em escala compartilhada (máximo entre os dois).
 */
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export interface RadarPlayer {
  name: string
  goals: number
  assists: number
  gamesPlayed: number
}

export default function PlayerRadar({ a, b }: { a: RadarPlayer; b: RadarPlayer }) {
  const data = [
    { stat: 'Gols', A: a.goals, B: b.goals },
    { stat: 'Assist.', A: a.assists, B: b.assists },
    { stat: 'Jogos', A: a.gamesPlayed, B: b.gamesPlayed },
    { stat: 'G+A', A: a.goals + a.assists, B: b.goals + b.assists },
  ]

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12, fill: '#475569' }} />
        <Radar name={a.name} dataKey="A" stroke="#16a34a" fill="#16a34a" fillOpacity={0.4} />
        <Radar name={b.name} dataKey="B" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}
