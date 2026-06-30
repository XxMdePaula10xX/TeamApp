/**
 * Notificações do usuário + contagem de não-lidas. Não-lida = criada após
 * `lastSeenNotificationsAt` (do doc do usuário). Abrir a tela de
 * notificações grava o lastSeen e zera o badge.
 */
import { useMemo } from 'react'
import { limit, orderBy, query } from 'firebase/firestore'
import type { NotificationDoc, UserDoc } from '@/types/models'
import { notificationsCol, userRef } from '@/services/paths'
import { useDocData, useQueryData } from './useFirestore'

const NOTIF_LIMIT = 50

export function useNotifications(uid: string | undefined) {
  const { data: items, loading } = useQueryData<NotificationDoc>(
    () => (uid ? query(notificationsCol(uid), orderBy('createdAt', 'desc'), limit(NOTIF_LIMIT)) : null),
    [uid],
  )
  const { data: userDoc } = useDocData<UserDoc>(() => (uid ? userRef(uid) : null), [uid])

  const lastSeenMs = userDoc?.lastSeenNotificationsAt?.toMillis?.() ?? 0

  const unread = useMemo(() => {
    if (!items) return 0
    return items.filter((n) => (n.createdAt?.toMillis?.() ?? 0) > lastSeenMs).length
  }, [items, lastSeenMs])

  return { items: items ?? [], unread, loading }
}
