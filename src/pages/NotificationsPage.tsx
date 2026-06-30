import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useNotifications } from '@/hooks/useNotifications'
import { markNotificationsSeen } from '@/services/notifications'
import { EmptyState, Loading } from '@/components/states'
import { timeAgo } from '@/utils/dates'
import type { AppNotification } from '@/types/models'

/** Central de notificações. Ao abrir, marca tudo como lido (zera o badge). */
export function NotificationsPage() {
  const uid = useAuthStore((s) => s.user?.uid)
  const { items, loading } = useNotifications(uid)

  // "Ser lidas ao entrar": grava o lastSeen ao abrir esta tela.
  useEffect(() => {
    if (uid) void markNotificationsSeen(uid).catch(() => {})
  }, [uid])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">Notificações</h1>

      {loading && <Loading />}

      {!loading && items.length === 0 && (
        <EmptyState
          icon="🔔"
          title="Nada por aqui ainda"
          description="Quando você registrar jogos, os destaques (vitórias, goleadas, hat-tricks) aparecem aqui."
        />
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
        </ul>
      )}
    </div>
  )
}

function NotificationItem({ n }: { n: AppNotification }) {
  const content = (
    <div className="card flex items-start gap-3">
      <span className="text-2xl leading-none" aria-hidden>
        {n.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{n.title}</p>
        {n.body && <p className="text-sm text-slate-500">{n.body}</p>}
        <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
      </div>
    </div>
  )
  return n.teamId ? (
    <li>
      <Link to={`/time/${n.teamId}`} className="block hover:opacity-90">
        {content}
      </Link>
    </li>
  ) : (
    <li>{content}</li>
  )
}
