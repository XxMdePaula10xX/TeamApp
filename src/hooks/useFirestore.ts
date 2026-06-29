/**
 * Helpers genéricos de subscription do Firestore com ciclo de vida
 * correto: reset ao trocar deps, flag `cancelled` contra snapshots
 * obsoletos, unsubscribe na limpeza, callbacks de sucesso E erro, e
 * `serverTimestamps: 'estimate'` (evita createdAt nulo offline).
 *
 * `data` começa `undefined`; `loading` vira false no 1º snapshot (sucesso
 * ou erro). Vazio = `!loading && data?.length === 0`.
 */
import { useEffect, useState, type DependencyList } from 'react'
import {
  onSnapshot,
  type DocumentData,
  type DocumentReference,
  type Query,
} from 'firebase/firestore'
import type { WithId } from '@/types/models'

const SNAPSHOT_OPTS = { serverTimestamps: 'estimate' } as const

export interface AsyncState<T> {
  data: T | undefined
  loading: boolean
  error: Error | null
}

const EMPTY_PENDING: ReadonlySet<string> = new Set()

export interface ListState<T> extends AsyncState<WithId<T>[]> {
  /** Ids de docs com escrita local ainda não confirmada pelo servidor. */
  pendingIds: ReadonlySet<string>
}

/** Assina uma query e devolve a lista hidratada com `id`. */
export function useQueryData<T>(
  makeQuery: () => Query<DocumentData> | null,
  deps: DependencyList,
): ListState<T> {
  const [state, setState] = useState<ListState<T>>({
    data: undefined,
    loading: true,
    error: null,
    pendingIds: EMPTY_PENDING,
  })

  useEffect(() => {
    let cancelled = false
    setState({ data: undefined, loading: true, error: null, pendingIds: EMPTY_PENDING })

    const q = makeQuery()
    if (!q) {
      setState({ data: [], loading: false, error: null, pendingIds: EMPTY_PENDING })
      return
    }

    const unsub = onSnapshot(
      q,
      // includeMetadataChanges: para refletir hasPendingWrites no badge de sync.
      { includeMetadataChanges: true },
      (snap) => {
        if (cancelled) return
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data(SNAPSHOT_OPTS) as T) }))
        const pendingIds = new Set(
          snap.docs.filter((d) => d.metadata.hasPendingWrites).map((d) => d.id),
        )
        setState({ data, loading: false, error: null, pendingIds })
      },
      (error) => {
        if (cancelled) return
        setState({ data: undefined, loading: false, error, pendingIds: EMPTY_PENDING })
      },
    )

    return () => {
      cancelled = true
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

/** Assina um documento; `data` é `null` quando não existe. */
export function useDocData<T>(
  makeRef: () => DocumentReference<DocumentData> | null,
  deps: DependencyList,
): AsyncState<WithId<T> | null> {
  const [state, setState] = useState<AsyncState<WithId<T> | null>>({
    data: undefined,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ data: undefined, loading: true, error: null })

    const ref = makeRef()
    if (!ref) {
      setState({ data: null, loading: false, error: null })
      return
    }

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (cancelled) return
        const data = snap.exists() ? ({ id: snap.id, ...(snap.data(SNAPSHOT_OPTS) as T) }) : null
        setState({ data, loading: false, error: null })
      },
      (error) => {
        if (cancelled) return
        setState({ data: undefined, loading: false, error })
      },
    )

    return () => {
      cancelled = true
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
