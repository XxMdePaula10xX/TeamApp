import { Placeholder } from '@/components/Placeholder'

/** Aba Visão geral (PRD §7.4): aproveitamento, pizza V/E/D, evolução. */
export function OverviewTab() {
  return (
    <Placeholder title="Visão geral" sprint="Sprint 2">
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500">
        <li>Cards de aproveitamento (V/E/D, saldo de gols)</li>
        <li>Gráfico de pizza V/E/D (Recharts)</li>
        <li>Evolução de resultados ao longo do tempo</li>
      </ul>
    </Placeholder>
  )
}
