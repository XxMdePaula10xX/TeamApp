/**
 * Estado de autenticação (Zustand). Apenas e-mail/senha: login, cadastro,
 * redefinição de senha e logout. (Exclusão de conta fica em
 * services/account.ts por exigir reautenticação + limpeza de dados.)
 */
import { create } from 'zustand'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ensureUserDoc } from '@/services/users'

interface AuthState {
  user: User | null
  /** true até o primeiro disparo do listener (evita "piscar" o login). */
  initializing: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  initializing: true,
  signInWithEmail: async (email, password) => {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  },
  signUpWithEmail: async (email, password) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password)
  },
  sendPasswordReset: async (email) => {
    await sendPasswordResetEmail(auth, email.trim())
  },
  signOut: async () => {
    await fbSignOut(auth)
  },
}))

/**
 * Assina o estado de autenticação do Firebase. Chamar uma vez no
 * bootstrap do app (`main.tsx`). Retorna a função de unsubscribe.
 */
export function initAuthListener(): () => void {
  return onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({ user, initializing: false })
    // Garante o doc users/{uid} no primeiro login (fire-and-forget).
    if (user) {
      void ensureUserDoc(user).catch((err) => {
        console.warn('[Pelada Manager] Falha ao criar/atualizar o doc do usuário:', err)
      })
    }
  })
}
