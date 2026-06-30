import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTeam } from '@/hooks/useTeams'
import { useIsOwner } from '@/hooks/useIsOwner'
import { createTeam, deleteTeam, updateTeam } from '@/services/teams'
import { recomputeTeamStats } from '@/services/games'
import { uploadImage } from '@/services/storage'
import { dateInputToTimestamp, timestampToDateInput } from '@/utils/dates'
import { Avatar } from '@/components/Avatar'
import { CityCombobox } from '@/components/CityCombobox'
import { ErrorState, Loading } from '@/components/states'

/** Cores rápidas (hex minúsculo, p/ casar com o valor do input color). */
const COLOR_PRESETS = ['#16a34a', '#dc2626', '#2563eb', '#0ea5e9', '#f59e0b', '#9333ea', '#0f172a']

/** Criar/Editar time (PRD §7.3). */
export function TeamFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const uid = useAuthStore((s) => s.user?.uid)

  const { team, loading: teamLoading, error: teamError } = useTeam(mode === 'edit' ? teamId : undefined)
  const { isOwner, ready } = useIsOwner(team, teamLoading)

  const [name, setName] = useState('')
  const [foundedAt, setFoundedAt] = useState('')
  const [primaryColor, setPrimaryColor] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingLogo, setExistingLogo] = useState('')
  const [maintBusy, setMaintBusy] = useState<null | 'delete' | 'recompute'>(null)
  const [maintNotice, setMaintNotice] = useState<string | null>(null)
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
      setPrimaryColor(team.primaryColor ?? null)
      setCity(team.city ?? null)
      setPhone(team.phone ?? '')
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
      const phoneClean = phone.trim() || null
      const base = { name, foundedAt: foundedTs, primaryColor, city, phone: phoneClean }
      const id =
        mode === 'create'
          ? await createTeam(uid, { ...base, logoURL: '' })
          : teamId!

      if (mode === 'edit') {
        await updateTeam(id, { ...base, logoURL: existingLogo })
      }

      // Upload da logo é OPCIONAL e desacoplado (Storage não funciona
      // offline): se falhar, o time fica salvo sem logo.
      if (logoFile) {
        try {
          const url = await uploadImage(`teams/${uid}/${id}`, 'logo', logoFile)
          await updateTeam(id, { ...base, logoURL: url })
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

  const onRecompute = async () => {
    if (!teamId || maintBusy) return
    setMaintBusy('recompute')
    setMaintNotice(null)
    try {
      await recomputeTeamStats(teamId)
      setMaintNotice('Estatísticas recalculadas.')
    } catch (err) {
      setMaintNotice(err instanceof Error ? err.message : 'Falha ao recalcular.')
    } finally {
      setMaintBusy(null)
    }
  }

  const onDeleteTeam = async () => {
    if (!teamId || maintBusy) return
    if (
      !window.confirm(
        `Excluir o time "${name || 'sem nome'}" e TODOS os dados (jogadores, jogos, estatísticas)? Esta ação é irreversível.`,
      )
    )
      return
    setMaintBusy('delete')
    setMaintNotice(null)
    try {
      await deleteTeam(teamId)
      navigate('/')
    } catch (err) {
      setMaintNotice(err instanceof Error ? err.message : 'Falha ao excluir.')
      setMaintBusy(null)
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

        <div>
          <span className="label">Cor do time</span>
          <div className="flex items-center gap-3">
            <label
              className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-300"
              style={{ backgroundColor: primaryColor ?? '#16a34a' }}
              title="Escolher cor"
            >
              <input
                type="color"
                className="sr-only"
                value={primaryColor ?? '#16a34a'}
                onChange={(e) => setPrimaryColor(e.target.value)}
                aria-label="Cor do time"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPrimaryColor(c)}
                  aria-label={`Cor ${c}`}
                  className={`h-7 w-7 rounded-full border-2 ${
                    primaryColor?.toLowerCase() === c ? 'border-slate-700' : 'border-white shadow'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPrimaryColor(null)}
            className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {primaryColor ? '↺ Usar cor padrão do app' : 'Usando a cor padrão do app'}
          </button>
        </div>

        <div>
          <span className="label">Cidade</span>
          <CityCombobox value={city} onChange={setCity} />
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Telefone de contato
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 90000-0000"
          />
          <p className="mt-1 text-xs text-slate-500">
            Para marcação de amistosos ou treinos. Fica visível na página pública do time.
          </p>
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

      {mode === 'edit' && (
        <>
          <div className="card space-y-2">
            <h2 className="text-sm font-semibold text-slate-700">Manutenção</h2>
            <p className="text-xs text-slate-500">
              Recalcula as estatísticas do zero a partir de todos os jogos (use se algum número
              parecer inconsistente).
            </p>
            <button
              type="button"
              onClick={onRecompute}
              disabled={maintBusy !== null}
              className="btn-ghost border border-slate-300 text-sm"
            >
              {maintBusy === 'recompute' ? 'Recalculando…' : '🔄 Recalcular estatísticas'}
            </button>
          </div>

          <details className="card border-red-200">
            <summary className="cursor-pointer text-sm font-semibold text-red-600">
              Zona de perigo
            </summary>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-500">
                Excluir o time apaga <strong>permanentemente</strong> jogadores, jogos e
                estatísticas. Não dá para desfazer.
              </p>
              <button
                type="button"
                onClick={onDeleteTeam}
                disabled={maintBusy !== null}
                className="btn-danger w-full"
              >
                {maintBusy === 'delete' ? 'Excluindo…' : '🗑️ Excluir time'}
              </button>
            </div>
          </details>

          {maintNotice && <p className="text-sm text-slate-500">{maintNotice}</p>}
        </>
      )}
    </div>
  )
}
