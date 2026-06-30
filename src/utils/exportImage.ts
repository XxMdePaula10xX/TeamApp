/**
 * Exporta um nó do DOM para PNG e compartilha (Web Share API com arquivo)
 * ou baixa como fallback. Usado nos cards de estatística (gancho de
 * viralização — PRD §7.4/§10). `html-to-image` é importado aqui para
 * ficar fora do bundle inicial (este módulo é carregado via lazy).
 */
import { toPng } from 'html-to-image'

export type ExportResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

async function nodeToBlob(node: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true })
  const res = await fetch(dataUrl)
  return res.blob()
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Adia o revoke: revogar no mesmo tick aborta o download em alguns
  // navegadores (Firefox/Safari/WebView) para blobs não-triviais.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function shareOrDownloadPng(
  node: HTMLElement,
  filename: string,
  shareTitle: string,
): Promise<ExportResult> {
  let blob: Blob
  try {
    blob = await nodeToBlob(node)
  } catch {
    return 'failed'
  }

  const file = new File([blob], filename, { type: 'image/png' })
  // Compartilhamento nativo com arquivo (mobile/Capacitor), quando suportado.
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: shareTitle })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
      // Qualquer outra falha de share → cai para download.
    }
  }

  try {
    download(blob, filename)
    return 'downloaded'
  } catch {
    return 'failed'
  }
}
