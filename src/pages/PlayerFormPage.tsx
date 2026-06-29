import { useParams } from 'react-router-dom'
import { Placeholder } from '@/components/Placeholder'
import { POSITION_LABELS, PREFERRED_FOOT_LABELS } from '@/types/models'

/** Cadastrar/Editar jogador (PRD §7.5). */
export function PlayerFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { playerId } = useParams()
  return (
    <Placeholder
      title={mode === 'create' ? 'Adicionar jogador' : 'Editar jogador'}
      sprint="Sprint 1"
    >
      <p className="text-sm text-slate-500">
        Campos: nome, foto, nº da camisa, posição (
        {Object.values(POSITION_LABELS).join(' / ')}), pé preferido (
        {Object.values(PREFERRED_FOOT_LABELS).join(' / ')}) e data de entrada.
        {mode === 'edit' && playerId && (
          <>
            {' '}
            Editando <code className="rounded bg-slate-100 px-1">{playerId}</code>.
          </>
        )}
      </p>
    </Placeholder>
  )
}
