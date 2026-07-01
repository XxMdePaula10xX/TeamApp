/**
 * Modal de pré-visualização do card de estatística, com ações de
 * compartilhar/baixar PNG. Lazy-loaded (puxa html-to-image só aqui).
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { shareOrDownloadPng } from '@/utils/exportImage'

interface Props {
  filename: string
  shareTitle: string
  onClose: () => void
  children: ReactNode
}

const CARD_WIDTH = 340 // largura fixa do StatCard (ver StatCard.tsx)

export default function ShareCardModal({ filename, shareTitle, onClose, children }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  // Imagem para salvar manualmente (iOS < 15, onde download não funciona).
  const [manualUrl, setManualUrl] = useState<string | null>(null)
  // Encolhe o preview para caber em telas estreitas (<~380px) sem cortar o
  // card. `zoom` afeta o layout (a captura usa cardRef no tamanho natural).
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const calc = () => setZoom(Math.min(1, (window.innerWidth - 40) / CARD_WIDTH))
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  // Fecha com Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onExport = async () => {
    if (!cardRef.current || busy) return
    setBusy(true)
    setNotice(null)
    setManualUrl(null)
    const outcome = await shareOrDownloadPng(cardRef.current, filename, shareTitle)
    if (outcome.result === 'downloaded') setNotice('Imagem salva! 📥')
    else if (outcome.result === 'manual' && outcome.dataUrl) {
      setManualUrl(outcome.dataUrl)
      setNotice('Segure a imagem abaixo e toque em "Salvar imagem" 👇')
    } else if (outcome.result === 'failed') setNotice('Não foi possível gerar a imagem.')
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
        {/* Wrapper com zoom só para o preview caber; a captura usa cardRef. */}
        <div style={{ zoom } as CSSProperties}>
          {/* Alvo da captura: envolve o card justo, sempre no tamanho natural. */}
          <div ref={cardRef} className="inline-block">
            {children}
          </div>
        </div>

        {manualUrl && (
          <img
            src={manualUrl}
            alt="Card gerado — segure para salvar"
            className="max-w-full rounded-2xl shadow-lg"
          />
        )}

        {notice && <p className="text-center text-sm text-white">{notice}</p>}

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
