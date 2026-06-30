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
import { deleteDoc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { notificationsCol, teamsCol, userRef } from './paths'
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

  // Apaga as notificações (subcoleção do usuário) em lotes.
  const notifs = await getDocs(notificationsCol(user.uid))
  for (let i = 0; i < notifs.docs.length; i += 450) {
    const batch = writeBatch(db)
    for (const d of notifs.docs.slice(i, i + 450)) batch.delete(d.ref)
    await batch.commit()
  }

  // Apaga o doc do usuário e, por fim, a conta de autenticação.
  await deleteDoc(userRef(user.uid))
  await deleteUser(user)
}
