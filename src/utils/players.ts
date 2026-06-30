/** Helpers de exibição de jogador (apelido tem prioridade sobre o nome). */
import type { Player } from '@/types/models'

/** Nome a exibir: apelido se houver, senão o nome. */
export function playerLabel(p: Pick<Player, 'name' | 'nickname'>): string {
  return p.nickname?.trim() || p.name
}

/** Versão curta (1ª palavra) — para caber em gráficos. */
export function playerShort(p: Pick<Player, 'name' | 'nickname'>): string {
  return playerLabel(p).trim().split(/\s+/)[0]
}
