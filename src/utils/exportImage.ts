/**
 * Exporta um nó do DOM para PNG e compartilha (Web Share API com arquivo)
 * ou baixa como fallback. Usado nos cards de estatística (gancho de
 * viralização — PRD §7.4/§10). `html-to-image` é importado aqui para
 * ficar fora do bundle inicial (este módulo é carregado via lazy).
 */
import { toPng } from 'html-to-image'

export type ExportResult = 'shared' | 'downloaded' | 'manual' | 'cancelled' | 'failed'

export interface ExportOutcome {
  result: ExportResult
  /** Presente quando result === 'manual' — a imagem para o usuário salvar. */
  dataUrl?: string
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    // iPadOS se apresenta como Mac; distingue pelo touch.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
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
): Promise<ExportOutcome> {
  let dataUrl: string
  try {
    dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true })
  } catch {
    return { result: 'failed' }
  }

  let blob: Blob
  try {
    blob = await (await fetch(dataUrl)).blob()
  } catch {
    return { result: 'failed' }
  }

  const file = new File([blob], filename, { type: 'image/png' })
  // Compartilhamento nativo com arquivo (iOS 15+/Android/Capacitor).
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: shareTitle })
      return { result: 'shared' }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return { result: 'cancelled' }
      // Qualquer outra falha de share → segue para o fallback.
    }
  }

  // iOS sem Web Share de arquivos (iOS < 15): o atributo `download` do <a>
  // NÃO salva no WKWebView e o clique é ignorado silenciosamente — antes o
  // app mentia "Imagem salva!". Em vez disso, devolvemos a imagem para o
  // usuário salvar com toque longo (comportamento nativo do WebView).
  if (isIOS()) return { result: 'manual', dataUrl }

  try {
    download(blob, filename)
    return { result: 'downloaded' }
  } catch {
    return { result: 'failed' }
  }
}
