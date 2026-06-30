/**
 * Central de notificações in-app (users/{uid}/notifications). Sem backend:
 * as notificações são geradas no client a partir dos eventos do time.
 * O badge "zera" gravando `lastSeenNotificationsAt` no doc do usuário.
 */
import { serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { newId, notificationRef, notificationsCol, userRef } from './paths'
import { buildGameNotifications, type GameNotifInput } from '@/utils/gameNotifications'

/** Marca as notificações como vistas (zera o badge do sino). */
export async function markNotificationsSeen(uid: string): Promise<void> {
  await updateDoc(userRef(uid), { lastSeenNotificationsAt: serverTimestamp() })
}

/**
 * Gera e grava as notificações de um jogo recém-salvo (best-effort:
 * falhas aqui não devem quebrar o fluxo de salvar o jogo).
 */
export async function notifyGameSaved(
  uid: string,
  teamId: string,
  input: GameNotifInput,
): Promise<void> {
  const payloads = buildGameNotifications(input)
  if (payloads.length === 0) return
  const batch = writeBatch(db)
  for (const p of payloads) {
    batch.set(notificationRef(uid, newId(notificationsCol(uid))), {
      type: p.type,
      emoji: p.emoji,
      title: p.title,
      body: p.body,
      teamId,
      createdAt: serverTimestamp(),
    })
  }
  await batch.commit()
}
