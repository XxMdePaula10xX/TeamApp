import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTeam } from '@/hooks/useTeams'
import { usePlayers } from '@/hooks/usePlayers'
import { useIsOwner } from '@/hooks/useIsOwner'
import { addPlayer, updatePlayer } from '@/services/players'
import { uploadImage } from '@/services/storage'
import { dateInputToTimestamp, timestampToDateInput } from '@/utils/dates'
import { Avatar } from '@/components/Avatar'
import { Loading } from '@/components/states'
import {
  POSITIONS,
  POSITION_LABELS,
  PREFERRED_FEET,
  PREFERRED_FOOT_LABELS,
  type Position,
  type PreferredFoot,
} from '@/types/models'

/** Cadastrar/Editar jogador (PRD §7.5). */
export function PlayerFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { teamId, playerId } = useParams()
  const navigate = useNavigate()
  const uid = useAuthStore((s) => s.user?.uid)
  const { team, loading: teamLoading } = useTeam(teamId)
  const { isOwner, ready } = useIsOwner(team, teamLoading)
  const { players } = usePlayers(mode === 'edit' ? teamId : undefined)

  const [name, setName] = useState('')
  const [shirt, setShirt] = useState('')
  const [position, setPosition] = useState<Position>('MEI')
  const [foot, setFoot] = useState<PreferredFoot>('DIREITO')
  const [joinedAt, setJoinedAt] = useState('')
  const [active, setActive] = useState(true)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [existingPhoto, setExistingPhoto] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    if (mode === 'edit' && players && !hydrated.current) {
      const p = players.find((x) => x.id === playerId)
      if (p) {
        hydrated.current = true
        setName(p.name)
        setShirt(p.shirtNumber != null ? String(p.shirtNumber) : '')
        setPosition(p.position)
        setFoot(p.preferredFoot)
        setJoinedAt(timestampToDateInput(p.joinedAt))
        setActive(p.active)
        setExistingPhoto(p.photoURL)
      }
    }
  }, [mode, players, playerId])

  // Preview do arquivo escolhido com revoke no cleanup (evita leak de blob URLs).
  const [filePreview, setFilePreview] = useState<string>()
  useEffect(() => {
    if (!photoFile) {
      setFilePreview(undefined)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setFilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  if (teamLoading) return <Loading />
  if (ready && !isOwner)
    return <p className="text-sm text-slate-500">Você não tem permissão para editar este elenco.</p>

  const previewUrl = filePreview ?? (existingPhoto || undefined)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!uid || !teamId || busy) return
    if (!name.trim()) {
      setError('Informe o nome do jogador.')
      return
    }
    const shirtNumber = shirt.trim() === '' ? null : Number(shirt)
    if (shirtNumber != null && (!Number.isInteger(shirtNumber) || shirtNumber < 0)) {
      setError('Número da camisa inválido.')
      return
    }

    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const input = {
        name,
        shirtNumber,
        position,
        preferredFoot: foot,
        joinedAt: dateInputToTimestamp(joinedAt),
        photoURL: existingPhoto,
        active,
      }
      const id = mode === 'create' ? await addPlayer(teamId, uid, input) : playerId!
      if (mode === 'edit') await updatePlayer(teamId, id, input)

      if (photoFile) {
        try {
          const url = await uploadImage(`players/${uid}/${teamId}`, id, photoFile)
          await updatePlayer(teamId, id, { ...input, photoURL: url })
        } catch {
          setNotice('Jogador salvo, mas a foto não subiu agora. Tente de novo com conexão.')
        }
      }

      navigate(`/time/${teamId}/elenco`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o jogador.')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">
        {mode === 'create' ? 'Adicionar jogador' : 'Editar jogador'}
      </h1>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={previewUrl} name={name || '?'} size={64} />
          <label className="btn-ghost cursor-pointer border border-slate-300 text-sm">
            Escolher foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <label className="label" htmlFor="pname">
            Nome
          </label>
          <input
            id="pname"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="shirt">
              Nº da camisa
            </label>
            <input
              id="shirt"
              type="number"
              inputMode="numeric"
              min={0}
              className="input"
              value={shirt}
              onChange={(e) => setShirt(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="joined">
              Entrou no time
            </label>
            <input
              id="joined"
              type="date"
              className="input"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="position">
              Posição
            </label>
            <select
              id="position"
              className="select"
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
            >
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {POSITION_LABELS[pos]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="foot">
              Pé preferido
            </label>
            <select
              id="foot"
              className="select"
              value={foot}
              onChange={(e) => setFoot(e.target.value as PreferredFoot)}
            >
              {PREFERRED_FEET.map((f) => (
                <option key={f} value={f}>
                  {PREFERRED_FOOT_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {mode === 'edit' && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Jogador ativo no elenco
          </label>
        )}

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
