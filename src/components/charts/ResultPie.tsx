/**
 * Pizza de Vitórias/Empates/Derrotas (Recharts). Carregado via lazy
 * import para não pesar o bundle inicial.
 */
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = { wins: '#16a34a', draws: '#94a3b8', losses: '#ef4444' }

export default function ResultPie({
  wins,
  draws,
  losses,
}: {
  wins: number
  draws: number
  losses: number
}) {
  const data = [
    { name: 'Vitórias', value: wins, fill: COLORS.wins },
    { name: 'Empates', value: draws, fill: COLORS.draws },
    { name: 'Derrotas', value: losses, fill: COLORS.losses },
  ].filter((d) => d.value > 0)

  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={45}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
