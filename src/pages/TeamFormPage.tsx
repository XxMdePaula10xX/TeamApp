import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTeam } from '@/hooks/useTeams'
import { useIsOwner } from '@/hooks/useIsOwner'
import { createTeam, updateTeam } from '@/services/teams'
import { uploadImage } from '@/services/storage'
import { dateInputToTimestamp, timestampToDateInput } from '@/utils/dates'
import { Avatar } from '@/components/Avatar'
import { ErrorState, Loading } from '@/components/states'

/** Criar/Editar time (PRD §7.3). */
export function TeamFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const uid = useAuthStore((s) => s.user?.uid)

  const { team, loading: teamLoading, error: teamError } = useTeam(mode === 'edit' ? teamId : undefined)
  const { isOwner, ready } = useIsOwner(team, teamLoading)

  const [name, setName] = useState('')
  const [foundedAt, setFoundedAt] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingLogo, setExistingLogo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const hydrated = useRef(false)

  // Hidrata o formulário uma única vez no modo edição.
  useEffect(() => {
    if (mode === 'edit' && team && !hydrated.current) {
      hydrated.current = true
      setName(team.name)
      setFoundedAt(timestampToDateInput(team.foundedAt))
      setExistingLogo(team.logoURL)
    }
  }, [mode, team])

  // Preview do arquivo escolhido com revoke no cleanup (evita leak de blob URLs).
  const [filePreview, setFilePreview] = useState<string>()
  useEffect(() => {
    if (!logoFile) {
      setFilePreview(undefined)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setFilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  if (mode === 'edit') {
    if (teamLoading) return <Loading />
    if (teamError) return <ErrorState error={teamError} />
    if (team === null) return <p className="text-sm text-slate-500">Time não encontrado.</p>
    if (ready && !isOwner)
      return <p className="text-sm text-slate-500">Você não tem permissão para editar este time.</p>
  }

  const previewUrl = filePreview ?? (existingLogo || undefined)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!uid || busy) return
    if (!name.trim()) {
      setError('Informe o nome do time.')
      return
    }
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const foundedTs = dateInputToTimestamp(foundedAt)
      const id =
        mode === 'create'
          ? await createTeam(uid, { name, foundedAt: foundedTs, logoURL: '' })
          : teamId!

      if (mode === 'edit') {
        await updateTeam(id, { name, foundedAt: foundedTs, logoURL: existingLogo })
      }

      // Upload da logo é OPCIONAL e desacoplado (Storage não funciona
      // offline): se falhar, o time fica salvo sem logo.
      if (logoFile) {
        try {
          const url = await uploadImage(`teams/${uid}/${id}`, 'logo', logoFile)
          await updateTeam(id, { name, foundedAt: foundedTs, logoURL: url })
        } catch {
          setNotice('Time salvo, mas não foi possível enviar a logo agora. Tente de novo com conexão.')
        }
      }

      navigate(`/time/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o time.')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">
        {mode === 'create' ? 'Criar time' : 'Editar time'}
      </h1>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={previewUrl} name={name || '?'} size={64} rounded="lg" />
          <label className="btn-ghost cursor-pointer border border-slate-300 text-sm">
            Escolher logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <label className="label" htmlFor="name">
            Nome do time
          </label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Real Resenha FC"
            maxLength={60}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="foundedAt">
            Data de fundação
          </label>
          <input
            id="foundedAt"
            type="date"
            className="input"
            value={foundedAt}
            onChange={(e) => setFoundedAt(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm text-amber-600">{notice}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
