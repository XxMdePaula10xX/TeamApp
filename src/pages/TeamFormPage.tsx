import { useParams } from 'react-router-dom'
import { Placeholder } from '@/components/Placeholder'

/** Criar/Editar time (PRD §7.3). Nome, logo (Storage) e data de fundação. */
export function TeamFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { teamId } = useParams()
  return (
    <Placeholder title={mode === 'create' ? 'Criar time' : 'Editar time'} sprint="Sprint 1">
      <p className="text-sm text-slate-500">
        Campos: nome, upload de logo (Firebase Storage) e data de fundação. Ao salvar, grava{' '}
        <code className="rounded bg-slate-100 px-1">normalizedName</code> e{' '}
        <code className="rounded bg-slate-100 px-1">ownerId</code>.
        {mode === 'edit' && teamId && (
          <>
            {' '}
            Editando <code className="rounded bg-slate-100 px-1">{teamId}</code>.
          </>
        )}
      </p>
    </Placeholder>
  )
}
