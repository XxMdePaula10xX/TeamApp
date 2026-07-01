/**
 * Redimensiona/recomprime uma imagem para JPEG antes do upload.
 *
 * Motivos (cenário mobile/campo):
 *  - iPhone entrega fotos da câmera em 12MP+ e, muitas vezes, no formato
 *    HEIC (image/heic). HEIC não renderiza em Android/web nem em todo <img>,
 *    então o avatar apareceria quebrado; e vários MB em 4G fraco travam o
 *    upload. Convertendo para JPEG pequeno resolvemos ambos.
 *  - Logos/avatares são exibidos com no máximo ~64px, então 512px basta
 *    (com folga para telas retina).
 *
 * Usa um <img> + <canvas> (decodificador nativo da plataforma — melhor
 * suporte a HEIC no WKWebView do iOS). Se algo falhar (formato que o canvas
 * não decodifica, toBlob ausente), devolve o arquivo ORIGINAL — nunca joga
 * fora o upload do usuário.
 */
export async function downscaleImage(file: File, maxSize = 512, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  // Sem canvas.toBlob (WebViews muito antigos) não dá para converter com segurança.
  if (typeof document === 'undefined' || !('toBlob' in HTMLCanvasElement.prototype)) return file

  try {
    const img = await loadImage(file)
    const w0 = img.naturalWidth || img.width
    const h0 = img.naturalHeight || img.height
    if (!w0 || !h0) return file

    const scale = Math.min(1, maxSize / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // Fundo branco: JPEG não tem alfa; evita PNGs transparentes virarem preto.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) return file

    const base = file.name.replace(/\.[^./\\]+$/, '') || 'image'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}
