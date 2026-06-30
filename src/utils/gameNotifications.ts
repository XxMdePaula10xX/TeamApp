/**
 * Monta as notificações geradas ao salvar um jogo (marcos/resultados do
 * meu time). Funções puras — o serviço grava o resultado.
 */
import type { GameEvent, Player } from '@/types/models'
import { computeResult } from '@/utils/stats'
import { playerLabel } from '@/utils/players'

export interface NotificationPayload {
  type: string
  emoji: string
  title: string
  body: string
}

export interface GameNotifInput {
  teamName: string
  opponent: string
  scoreFor: number
  scoreAgainst: number
  events: GameEvent[]
  players: Player[]
}

const GOLEADA_DIFF = 4

export function buildGameNotifications(input: GameNotifInput): NotificationPayload[] {
  const { opponent, scoreFor, scoreAgainst, events, players } = input
  const out: NotificationPayload[] = []
  const placar = `${scoreFor}×${scoreAgainst}`
  const result = computeResult(scoreFor, scoreAgainst)
  const diff = scoreFor - scoreAgainst

  // Resultado (com destaque para goleada).
  if (result === 'VITORIA') {
    const goleada = diff >= GOLEADA_DIFF
    out.push({
      type: 'resultado',
      emoji: goleada ? '💪' : '✅',
      title: goleada ? `Goleada! ${placar} contra ${opponent}` : `Vitória ${placar} contra ${opponent}`,
      body: goleada ? 'Que atropelo! 🔥' : 'Mais 3 pontos no bolso.',
    })
  } else if (result === 'EMPATE') {
    out.push({
      type: 'resultado',
      emoji: '🤝',
      title: `Empate ${placar} contra ${opponent}`,
      body: 'Dividiu os pontos.',
    })
  } else {
    out.push({
      type: 'resultado',
      emoji: '❌',
      title: `Derrota ${placar} contra ${opponent}`,
      body: 'Bola pra frente, próximo jogo a gente vira.',
    })
  }

  // Hat-trick (3+ gols de um mesmo jogador neste jogo).
  const perPlayer = new Map<string, number>()
  for (const e of events) {
    if (e.type === 'GOL' && e.playerId) perPlayer.set(e.playerId, (perPlayer.get(e.playerId) ?? 0) + 1)
  }
  for (const [pid, goals] of perPlayer) {
    if (goals < 3) continue
    const player = players.find((p) => p.id === pid)
    const name = player ? playerLabel(player) : 'Jogador'
    out.push({
      type: 'hattrick',
      emoji: '🎩',
      title: `Hat-trick de ${name}!`,
      body: `${goals} gols num jogo só contra ${opponent}.`,
    })
  }

  return out
}
