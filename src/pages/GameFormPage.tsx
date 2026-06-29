import { useParams } from 'react-router-dom'
import { Placeholder } from '@/components/Placeholder'

/**
 * Cadastrar/Editar jogo (PRD §7.6) — o fluxo crítico, precisa ser
 * rápido (< 90s). Passos: adversário+data → tipo (amistoso/campeonato)
 * → presença → placar → gols/assistências → validação → salvar com
 * recálculo de agregados em transação.
 */
export function GameFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { gameId } = useParams()
  return (
    <Placeholder title={mode === 'create' ? 'Novo jogo' : 'Editar jogo'} sprint="Sprint 1">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-500">
        <li>Adversário + data</li>
        <li>Tipo: amistoso / campeonato (combobox de competições)</li>
        <li>Marcar presença (alimenta frequência)</li>
        <li>Placar final</li>
        <li>Gols/assistências (autor ou "não-atribuído")</li>
        <li>Validação: gols atribuídos ≤ placar a favor</li>
      </ol>
      {mode === 'edit' && gameId && (
        <p className="pt-2 text-sm text-slate-500">
          Ao editar, reverter os agregados antigos antes de reaplicar (ver{' '}
          <code className="rounded bg-slate-100 px-1">utils/stats.ts</code>).
        </p>
      )}
    </Placeholder>
  )
}
