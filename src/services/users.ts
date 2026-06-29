/**
 * Documento do usuário (users/{uid}). Criado no primeiro login sem
 * sobrescrever `createdAt` em logins subsequentes.
 */
import type { User } from 'firebase/auth'
import { getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { userRef } from './paths'

export async function ensureUserDoc(user: User): Promise<void> {
  const ref = userRef(user.uid)
  const profile = {
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    photoURL: user.photoURL ?? '',
  }

  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() })
  } else {
    // Mantém createdAt original; só atualiza o perfil.
    await updateDoc(ref, profile)
  }
}
