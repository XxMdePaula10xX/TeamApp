import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Placeholder } from '@/components/Placeholder'

/** Aba Elenco (PRD §7.4): lista de jogadores + adicionar (só dono). */
export function SquadTab() {
  const { teamId } = useParams()
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link to={`/time/${teamId}/jogador/novo`} className="btn-primary text-sm">
          + Adicionar jogador
        </Link>
      </div>
      <Placeholder title="Elenco" sprint="Sprint 1">
        <p className="text-sm text-slate-500">
          Lista de jogadores com nº da camisa, posição, pé e tempo de casa.
        </p>
      </Placeholder>
    </div>
  )
}
