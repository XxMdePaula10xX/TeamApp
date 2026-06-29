/**
 * Estado de autenticação (Zustand).
 *
 * Mantém o usuário atual e o estado de carregamento inicial. A
 * implementação completa do fluxo de login (criação do doc em
 * `users/{uid}`, tratamento de erros) entra no Sprint 1; aqui fica a
 * fundação: listener de sessão + ações de sign-in/out.
 */
import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

interface AuthState {
  user: User | null
  /** true até o primeiro disparo do listener (evita "piscar" o login). */
  initializing: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  initializing: true,
  signInWithGoogle: async () => {
    await signInWithPopup(auth, googleProvider)
  },
  signInWithEmail: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
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
  })
}
