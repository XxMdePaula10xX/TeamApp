/**
 * Upload de imagens (logos de time, fotos de jogador) para o Firebase
 * Storage. Observação: uploads NÃO funcionam offline — a UI deve permitir
 * salvar o time/jogador sem foto e adicionar a imagem depois, quando
 * houver conexão.
 */
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { downscaleImage } from '@/utils/image'

/** Extensão a partir do nome do arquivo (default jpg). */
function extOf(file: File): string {
  const dot = file.name.lastIndexOf('.')
  return dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : 'jpg'
}

/**
 * Faz upload de uma imagem para `path/{name}.{ext}` e devolve a URL pública.
 * A imagem é redimensionada/convertida para JPEG antes (resolve HEIC do iPhone
 * e reduz o tamanho para redes móveis fracas).
 * @param path pasta lógica, ex.: `teams/${teamId}` ou `players/${teamId}`
 * @param name nome-base do arquivo (ex.: 'logo' ou o playerId)
 */
export async function uploadImage(path: string, name: string, file: File): Promise<string> {
  const prepared = await downscaleImage(file)
  const storageRef = ref(storage, `${path}/${name}.${extOf(prepared)}`)
  await uploadBytes(storageRef, prepared, { contentType: prepared.type })
  return getDownloadURL(storageRef)
}
