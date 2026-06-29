import { useEffect, useMemo, useReducer, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTeam } from '@/hooks/useTeams'
import { usePlayers } from '@/hooks/usePlayers'
import { useCompetitions } from '@/hooks/useCompetitions'
import { useGame } from '@/hooks/useGames'
import { useIsOwner } from '@/hooks/useIsOwner'
import { createGame, updateGame, GameValidationError, type GameInput } from '@/services/games'
import { findCompetitionByName } from '@/services/competitions'
import { dateInputToTimestamp, timestampToDateInput } from '@/utils/dates'
import { Loading } from '@/components/states'
import type { GameEvent, GameType, HomeAway } from '@/types/models'

// ── Estado (useReducer) ──────────────────────────────────────

interface GoalDraft {
  uid: string
  playerId: string | null
  assistPlayerId: string | null
}

interface Draft {
  opponent: string
  date: string
  type: GameType
  homeAway: HomeAway | null
  scoreFor: number
  scoreAgainst: number
  presentPlayerIds: string[]
  goals: GoalDraft[]
  competitionId: string | null
  compText: string
}

function todayInput(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const initialDraft = (): Draft => ({
  opponent: '',
  date: todayInput(),
  type: 'AMISTOSO',
  homeAway: null,
  scoreFor: 0,
  scoreAgainst: 0,
  presentPlayerIds: [],
  goals: [],
  competitionId: null,
  compText: '',
})

type Action =
  | { kind: 'FIELD'; key: 'opponent' | 'date'; value: string }
  | { kind: 'HOME_AWAY'; value: HomeAway | null }
  | { kind: 'SET_TYPE'; value: GameType }
  | { kind: 'SCORE'; side: 'for' | 'against'; value: number }
  | { kind: 'TOGGLE_PRESENCE'; playerId: string }
  | { kind: 'ADD_GOAL' }
  | { kind: 'UPDATE_GOAL'; uid: string; patch: Partial<GoalDraft> }
  | { kind: 'REMOVE_GOAL'; uid: string }
  | { kind: 'SET_COMPETITION'; id: string | null; text: string }
  | { kind: 'HYDRATE'; draft: Draft }

const withPresence = (ids: string[], playerId: string): string[] =>
  ids.includes(playerId) ? ids : [...ids, playerId]

function reducer(state: Draft, action: Action): Draft {
  switch (action.kind) {
    case 'FIELD':
      return { ...state, [action.key]: action.value }
    case 'HOME_AWAY':
      return { ...state, homeAway: action.value }
    case 'SET_TYPE':
      return action.value === 'AMISTOSO'
        ? { ...state, type: 'AMISTOSO', competitionId: null, compText: '' }
        : { ...state, type: 'CAMPEONATO' }
    case 'SCORE':
      return action.side === 'for'
        ? { ...state, scoreFor: Math.max(0, action.value) }
        : { ...state, scoreAgainst: Math.max(0, action.value) }
    case 'TOGGLE_PRESENCE':
      return {
        ...state,
        presentPlayerIds: state.presentPlayerIds.includes(action.playerId)
          ? state.presentPlayerIds.filter((id) => id !== action.playerId)
          : [...state.presentPlayerIds, action.playerId],
      }
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, { uid: crypto.randomUUID(), playerId: null, assistPlayerId: null }],
      }
    case 'UPDATE_GOAL': {
      let presentPlayerIds = state.presentPlayerIds
      const patch = { ...action.patch }
      if (patch.playerId) presentPlayerIds = withPresence(presentPlayerIds, patch.playerId)
      if (patch.assistPlayerId) presentPlayerIds = withPresence(presentPlayerIds, patch.assistPlayerId)
      return {
        ...state,
        presentPlayerIds,
        goals: state.goals.map((g) => {
          if (g.uid !== action.uid) return g
          const next = { ...g, ...patch }
          // Gol não-atribuído não pode ter assistência.
          if (next.playerId === null) next.assistPlayerId = null
          return next
        }),
      }
    }
    case 'REMOVE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.uid !== action.uid) }
    case 'SET_COMPETITION':
      return { ...state, competitionId: action.id, compText: action.text }
    case 'HYDRATE':
      return action.draft
  }
}

// ── Componente ───────────────────────────────────────────────

export function GameFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { teamId, gameId } = useParams()
  const navigate = useNavigate()
  const uid = useAuthStore((s) => s.user?.uid)

  const { team, loading: teamLoading } = useTeam(teamId)
  const { isOwner, ready } = useIsOwner(team, teamLoading)
  const { players } = usePlayers(teamId)
  const { competitions } = useCompetitions(teamId)
  const { game, loading: gameLoading } = useGame(teamId, mode === 'edit' ? gameId : undefined)

  const [draft, dispatch] = useReducer(reducer, undefined, initialDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hydrated = useRef(false)

  // Hidrata o editor UMA vez (modo edição), ignorando snapshots seguintes.
  useEffect(() => {
    if (mode !== 'edit' || hydrated.current) return
    if (!game || !competitions) return
    hydrated.current = true
    dispatch({
      kind: 'HYDRATE',
      draft: {
        opponent: game.opponent,
        date: timestampToDateInput(game.date),
        type: game.type,
        homeAway: game.homeAway,
        scoreFor: game.scoreFor,
        scoreAgainst: game.scoreAgainst,
        presentPlayerIds: game.presentPlayerIds,
        goals: game.events
          .filter((e) => e.type === 'GOL' && e.playerId)
          .map((e) => ({
            uid: crypto.randomUUID(),
            playerId: e.playerId,
            assistPlayerId: e.assistPlayerId,
          })),
        competitionId: game.competitionId,
        compText: game.competitionId
          ? (competitions.find((c) => c.id === game.competitionId)?.name ?? '')
          : '',
      },
    })
  }, [mode, game, competitions])

  // Roster selecionável: ativos + inativos já presentes/citados no jogo.
  const roster = useMemo(() => {
    const all = players ?? []
    const referenced = new Set([
      ...draft.presentPlayerIds,
      ...draft.goals.flatMap((g) => [g.playerId, g.assistPlayerId].filter(Boolean) as string[]),
    ])
    return all.filter((p) => p.active || referenced.has(p.id))
  }, [players, draft.presentPlayerIds, draft.goals])

  const attributed = draft.goals.filter((g) => g.playerId).length
  const unattributed = draft.scoreFor - attributed
  const scoreValid = attributed <= draft.scoreFor

  if (teamLoading || (mode === 'edit' && gameLoading)) return <Loading />
  if (ready && !isOwner)
    return <p className="text-sm text-slate-500">Você não tem permissão para editar jogos deste time.</p>

  const filteredComps = (competitions ?? []).filter((c) =>
    c.name.toLowerCase().includes(draft.compText.toLowerCase()),
  )

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!uid || !teamId || busy) return
    setError(null)

    const dateTs = dateInputToTimestamp(draft.date)
    if (!dateTs) {
      setError('Informe a data do jogo.')
      return
    }
    if (!scoreValid) {
      setError(`Você atribuiu ${attributed} gol(s), mais que o placar a favor (${draft.scoreFor}).`)
      return
    }

    // Resolve competição (existente, dedupe por nome, ou nova).
    let competitionId: string | null = null
    let newCompetitionName: string | null = null
    if (draft.type === 'CAMPEONATO') {
      if (draft.competitionId) {
        competitionId = draft.competitionId
      } else if (draft.compText.trim()) {
        const existing = findCompetitionByName(competitions ?? [], draft.compText)
        if (existing) competitionId = existing.id
        else newCompetitionName = draft.compText.trim()
      }
    }

    const events: GameEvent[] = draft.goals
      .filter((g) => g.playerId)
      .map((g) => ({
        type: 'GOL',
        playerId: g.playerId,
        assistPlayerId: g.assistPlayerId,
        minute: null,
      }))

    const input: GameInput = {
      opponent: draft.opponent,
      date: dateTs,
      type: draft.type,
      homeAway: draft.homeAway,
      scoreFor: draft.scoreFor,
      scoreAgainst: draft.scoreAgainst,
      presentPlayerIds: draft.presentPlayerIds,
      events,
      competitionId,
      newCompetitionName,
    }

    setBusy(true)
    try {
      if (mode === 'create') {
        await createGame(teamId, uid, input, players ?? [])
      } else if (game) {
        await updateGame(teamId, game.id, game, input, players ?? [])
      }
      navigate(`/time/${teamId}/jogos`)
    } catch (err) {
      const msg =
        err instanceof GameValidationError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível salvar o jogo.'
      setError(msg)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">
        {mode === 'create' ? 'Novo jogo' : 'Editar jogo'}
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Adversário + data */}
        <div className="card space-y-3">
          <div>
            <label className="label" htmlFor="opponent">
              Adversário
            </label>
            <input
              id="opponent"
              className="input"
              value={draft.opponent}
              onChange={(e) => dispatch({ kind: 'FIELD', key: 'opponent', value: e.target.value })}
              placeholder="Ex.: Os Bagre FC"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="date">
                Data
              </label>
              <input
                id="date"
                type="date"
                className="input"
                value={draft.date}
                onChange={(e) => dispatch({ kind: 'FIELD', key: 'date', value: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Mando</label>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
                <HomeAwayBtn label="—" active={draft.homeAway === null} onClick={() => dispatch({ kind: 'HOME_AWAY', value: null })} />
                <HomeAwayBtn label="Casa" active={draft.homeAway === 'CASA'} onClick={() => dispatch({ kind: 'HOME_AWAY', value: 'CASA' })} />
                <HomeAwayBtn label="Fora" active={draft.homeAway === 'FORA'} onClick={() => dispatch({ kind: 'HOME_AWAY', value: 'FORA' })} />
              </div>
            </div>
          </div>
        </div>

        {/* Tipo + competição */}
        <div className="card space-y-3">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <TypeBtn label="Amistoso" active={draft.type === 'AMISTOSO'} onClick={() => dispatch({ kind: 'SET_TYPE', value: 'AMISTOSO' })} />
            <TypeBtn label="Campeonato" active={draft.type === 'CAMPEONATO'} onClick={() => dispatch({ kind: 'SET_TYPE', value: 'CAMPEONATO' })} />
          </div>
          {draft.type === 'CAMPEONATO' && (
            <div>
              <label className="label" htmlFor="comp">
                Competição
              </label>
              <input
                id="comp"
                className="input"
                value={draft.compText}
                onChange={(e) => dispatch({ kind: 'SET_COMPETITION', id: null, text: e.target.value })}
                placeholder="Digite para buscar ou criar"
                autoComplete="off"
              />
              {draft.compText.trim() && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {filteredComps.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => dispatch({ kind: 'SET_COMPETITION', id: c.id, text: c.name })}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        draft.competitionId === c.id
                          ? 'border-pitch-500 bg-pitch-50 text-pitch-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  {!findCompetitionByName(competitions ?? [], draft.compText) && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      Criar “{draft.compText.trim()}”
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Placar */}
        <div className="card">
          <label className="label">Placar final</label>
          <div className="flex items-center justify-center gap-4">
            <Stepper
              label="Nós"
              value={draft.scoreFor}
              onChange={(v) => dispatch({ kind: 'SCORE', side: 'for', value: v })}
            />
            <span className="text-2xl font-bold text-slate-300">×</span>
            <Stepper
              label={draft.opponent.trim() || 'Eles'}
              value={draft.scoreAgainst}
              onChange={(v) => dispatch({ kind: 'SCORE', side: 'against', value: v })}
            />
          </div>
        </div>

        {/* Gols/assistências */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Gols do nosso time</label>
            <span className={`text-xs ${scoreValid ? 'text-slate-500' : 'text-red-600'}`}>
              {attributed} de {draft.scoreFor} atribuído(s) ·{' '}
              {Math.max(0, unattributed)} não-atribuído(s)
            </span>
          </div>

          {draft.goals.map((goal) => (
            <div key={goal.uid} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2">
              <select
                className="select flex-1"
                value={goal.playerId ?? ''}
                onChange={(e) =>
                  dispatch({
                    kind: 'UPDATE_GOAL',
                    uid: goal.uid,
                    patch: { playerId: e.target.value || null },
                  })
                }
              >
                <option value="">Não-atribuído / contra</option>
                {roster.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.active ? '' : ' (inativo)'}
                  </option>
                ))}
              </select>
              {goal.playerId && (
                <select
                  className="select flex-1"
                  value={goal.assistPlayerId ?? ''}
                  onChange={(e) =>
                    dispatch({
                      kind: 'UPDATE_GOAL',
                      uid: goal.uid,
                      patch: { assistPlayerId: e.target.value || null },
                    })
                  }
                >
                  <option value="">Sem assistência</option>
                  {roster
                    .filter((p) => p.id !== goal.playerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        🅰 {p.name}
                      </option>
                    ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => dispatch({ kind: 'REMOVE_GOAL', uid: goal.uid })}
                className="btn-ghost px-2 py-1 text-xs text-red-600"
                aria-label="Remover gol"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => dispatch({ kind: 'ADD_GOAL' })}
            disabled={draft.goals.length >= draft.scoreFor}
            className="btn-ghost w-full border border-dashed border-slate-300 text-sm"
          >
            + Adicionar autor de gol
          </button>
          {draft.scoreFor === 0 && (
            <p className="text-center text-xs text-slate-400">Defina o placar a favor para atribuir gols.</p>
          )}
        </div>

        {/* Presença */}
        <div className="card space-y-2">
          <label className="label mb-0">Presença ({draft.presentPlayerIds.length})</label>
          {roster.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem jogadores ativos. Você ainda pode salvar só com o placar.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {roster.map((p) => {
                const on = draft.presentPlayerIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => dispatch({ kind: 'TOGGLE_PRESENCE', playerId: p.id })}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      on
                        ? 'border-pitch-500 bg-pitch-50 text-pitch-700'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    {p.shirtNumber != null ? `${p.shirtNumber} ` : ''}
                    {p.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="sticky bottom-16 flex gap-2 bg-slate-50 py-1">
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? 'Salvando…' : 'Salvar jogo'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancelar
          </button>
        </div>
      </form>

      <p className="text-xs text-slate-400">
        Autores e assistentes são marcados como presentes automaticamente.
      </p>
    </div>
  )
}

// ── Subcomponentes ───────────────────────────────────────────

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-600"
          aria-label={`Diminuir ${label}`}
        >
          −
        </button>
        <span className="w-8 text-center text-3xl font-extrabold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-pitch-100 text-xl font-bold text-pitch-700"
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
      </div>
      <span className="max-w-24 truncate text-xs text-slate-500">{label}</span>
    </div>
  )
}

function TypeBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
        active ? 'bg-white text-pitch-700 shadow-sm' : 'text-slate-500'
      }`}
    >
      {label}
    </button>
  )
}

function HomeAwayBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-2 py-1 transition-colors ${
        active ? 'bg-white text-pitch-700 shadow-sm' : 'text-slate-500'
      }`}
    >
      {label}
    </button>
  )
}
