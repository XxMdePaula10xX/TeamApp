/**
 * Busca de times com debounce. Dispara `searchTeams` ~300ms após o
 * usuário parar de digitar, ignora termos curtos e cancela resultados
 * obsoletos. `searched` indica que uma busca válida já retornou (para
 * distinguir "vazio" de "ainda não buscou").
 */
import { useEffect, useState } from 'react'
import { searchTeams, SEARCH_MIN_LENGTH } from '@/services/teams'
import { normalizeName } from '@/utils/normalize'
import type { Team } from '@/types/models'

const DEBOUNCE_MS = 300

interface SearchState {
  results: Team[]
  loading: boolean
  error: Error | null
  searched: boolean
  tooShort: boolean
}

export function useTeamSearch(term: string): SearchState {
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null,
    searched: false,
    tooShort: false,
  })

  useEffect(() => {
    const normalized = normalizeName(term)
    if (normalized.length < SEARCH_MIN_LENGTH) {
      setState({ results: [], loading: false, error: null, searched: false, tooShort: normalized.length > 0 })
      return
    }

    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null, tooShort: false }))

    const timer = setTimeout(async () => {
      try {
        const results = await searchTeams(term)
        if (!cancelled) setState({ results, loading: false, error: null, searched: true, tooShort: false })
      } catch (error) {
        if (!cancelled)
          setState({
            results: [],
            loading: false,
            error: error instanceof Error ? error : new Error('Falha na busca'),
            searched: true,
            tooShort: false,
          })
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term])

  return state
}
