/**
 * Inicialização do Firebase (Web SDK modular).
 *
 * Config vem das variáveis VITE_FIREBASE_* (ver `.env.example`).
 * Persistência offline do Firestore é habilitada para o caso de uso
 * "lançar o placar no campo sem sinal" (PRD §3).
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Aviso amigável em dev quando o `.env` ainda não foi preenchido.
if (import.meta.env.DEV && (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-api-key')) {
  console.warn(
    '[Pelada Manager] Firebase não configurado. Copie `.env.example` para `.env` e ' +
      'preencha as credenciais VITE_FIREBASE_* do seu projeto.',
  )
}

export const app: FirebaseApp = initializeApp(firebaseConfig)

export const auth: Auth = getAuth(app)

export const googleProvider = new GoogleAuthProvider()

/**
 * Firestore com cache local persistente (IndexedDB) e suporte a múltiplas
 * abas. Substitui o antigo `enableIndexedDbPersistence` (deprecado).
 */
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

export const storage: FirebaseStorage = getStorage(app)
