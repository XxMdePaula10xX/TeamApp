/**
 * Exclusão de conta (LGPD/limpeza). Operação sensível: exige
 * reautenticação com a senha atual. Remove os dados do usuário antes de
 * apagar a conta de auth, para não deixar times/jogos órfãos.
 *
 * Ordem importa: reautentica → apaga times do dono (cascade) → apaga o
 * doc users/{uid} → deleteUser. Tudo enquanto a sessão ainda é válida.
 */
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from 'firebase/auth'
import { deleteDoc, getDocs, query, where } from 'firebase/firestore'
import { auth } from '@/lib/firebase'
import { teamsCol, userRef } from './paths'
import { deleteTeam } from './teams'

export async function deleteAccount(password: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('Sessão inválida. Entre novamente e tente de novo.')

  // Reautentica (Firebase exige login recente para excluir a conta).
  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)

  // Apaga os times do usuário (cada um cascateia suas subcoleções).
  const owned = await getDocs(query(teamsCol(), where('ownerId', '==', user.uid)))
  for (const teamDoc of owned.docs) {
    await deleteTeam(teamDoc.id)
  }

  // Apaga o doc do usuário e, por fim, a conta de autenticação.
  await deleteDoc(userRef(user.uid))
  await deleteUser(user)
}
