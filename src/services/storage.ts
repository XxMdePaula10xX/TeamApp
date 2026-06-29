/**
 * Upload de imagens (logos de time, fotos de jogador) para o Firebase
 * Storage. Observação: uploads NÃO funcionam offline — a UI deve permitir
 * salvar o time/jogador sem foto e adicionar a imagem depois, quando
 * houver conexão.
 */
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/lib/firebase'

/** Extensão a partir do nome do arquivo (default jpg). */
function extOf(file: File): string {
  const dot = file.name.lastIndexOf('.')
  return dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : 'jpg'
}

/**
 * Faz upload de uma imagem para `path/{name}.{ext}` e devolve a URL pública.
 * @param path pasta lógica, ex.: `teams/${teamId}` ou `players/${teamId}`
 * @param name nome-base do arquivo (ex.: 'logo' ou o playerId)
 */
export async function uploadImage(path: string, name: string, file: File): Promise<string> {
  const storageRef = ref(storage, `${path}/${name}.${extOf(file)}`)
  await uploadBytes(storageRef, file, { contentType: file.type })
  return getDownloadURL(storageRef)
}
