/**
 * Modal de pré-visualização do card de estatística, com ações de
 * compartilhar/baixar PNG. Lazy-loaded (puxa html-to-image só aqui).
 */
import { useRef, useState, type ReactNode } from 'react'
import { shareOrDownloadPng } from '@/utils/exportImage'

interface Props {
  filename: string
  shareTitle: string
  onClose: () => void
  children: ReactNode
}

export default function ShareCardModal({ filename, shareTitle, onClose, children }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const onExport = async () => {
    if (!cardRef.current || busy) return
    setBusy(true)
    setNotice(null)
    const result = await shareOrDownloadPng(cardRef.current, filename, shareTitle)
    if (result === 'downloaded') setNotice('Imagem salva! 📥')
    else if (result === 'failed') setNotice('Não foi possível gerar a imagem.')
    else setNotice(null) // shared / cancelled
    setBusy(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-sm flex-col items-center gap-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Alvo da captura: envolve o card justo. */}
        <div ref={cardRef} className="inline-block">
          {children}
        </div>

        {notice && <p className="text-sm text-white">{notice}</p>}

        <div className="flex w-full gap-2">
          <button onClick={onExport} disabled={busy} className="btn-primary flex-1">
            {busy ? 'Gerando…' : '📤 Compartilhar / Baixar'}
          </button>
          <button onClick={onClose} className="btn bg-white/15 text-white hover:bg-white/25">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
