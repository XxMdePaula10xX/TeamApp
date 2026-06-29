import { Placeholder } from '@/components/Placeholder'

/** Aba Estatísticas (PRD §7.4): artilharia, assistências, frequência, cards. */
export function StatsTab() {
  return (
    <Placeholder title="Estatísticas" sprint="Sprint 2">
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500">
        <li>Tabela de artilharia (ranking de gols)</li>
        <li>Líderes de assistência</li>
        <li>Gols por jogador (gráfico de barras)</li>
        <li>Frequência/presença por jogador</li>
        <li>Cards compartilháveis em PNG (Sprint 4)</li>
      </ul>
    </Placeholder>
  )
}
