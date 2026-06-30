/**
 * Modal com QR Code do link público do time (ideia #18 — convidar/seguir).
 * Lazy-loaded (puxa qrcode.react só aqui).
 */
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { shareLink } from '@/utils/share'

export default function QrModal({
  url,
  title,
  onClose,
}: {
  url: string
  title: string
  onClose: () => void
}) {
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onShare = async () => {
    const result = await shareLink(title, url)
    if (result === 'copied') setNotice('Link copiado!')
    else if (result === 'failed') setNotice('Não foi possível compartilhar.')
    else setNotice(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-extrabold text-slate-900">Convide pra ver o time</h2>
        <p className="mt-1 text-xs text-slate-500">Aponte a câmera para abrir a página pública.</p>

        <div className="mx-auto mt-4 w-fit rounded-xl border border-slate-200 bg-white p-3">
          <QRCodeSVG value={url} size={180} level="M" fgColor="#14532d" />
        </div>

        <p className="mt-3 break-all text-xs text-slate-400">{url}</p>
        {notice && <p className="mt-2 text-sm text-pitch-700">{notice}</p>}

        <div className="mt-4 flex gap-2">
          <button onClick={onShare} className="btn-primary flex-1">
            🔗 Compartilhar link
          </button>
          <button onClick={onClose} className="btn-ghost border border-slate-300">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
