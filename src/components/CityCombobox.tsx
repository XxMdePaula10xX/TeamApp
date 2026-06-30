/**
 * Combobox de cidade (todas as ~5.590 cidades do Brasil, formato
 * "Cidade - UF"). Só aceita valores da lista — evita "São Paulo" vs
 * "sao paulo" vs "SP". A base é carregada via lazy import na 1ª interação.
 */
import { useEffect, useRef, useState } from 'react'
import { normalizeName } from '@/utils/normalize'

let citiesCache: string[] | null = null
async function loadCities(): Promise<string[]> {
  if (citiesCache) return citiesCache
  const mod = await import('@/data/citiesBR.json')
  citiesCache = mod.default as string[]
  return citiesCache
}

const MAX_RESULTS = 40

export function CityCombobox({
  value,
  onChange,
}: {
  value: string | null
  onChange: (city: string | null) => void
}) {
  const [text, setText] = useState(value ?? '')
  const [cities, setCities] = useState<string[] | null>(citiesCache)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout>>()

  // Reflete mudanças externas do value (ex.: hidratação no modo edição).
  useEffect(() => {
    setText(value ?? '')
  }, [value])

  const ensureLoaded = () => {
    if (cities || loading) return
    setLoading(true)
    loadCities()
      .then((list) => setCities(list))
      .finally(() => setLoading(false))
  }

  const term = normalizeName(text)
  const matches =
    open && cities && term.length >= 1
      ? cities.filter((c) => normalizeName(c).includes(term)).slice(0, MAX_RESULTS)
      : []

  const select = (city: string) => {
    onChange(city)
    setText(city)
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setText('')
    setOpen(true)
    ensureLoaded()
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          className="input"
          value={text}
          placeholder="Digite e escolha a cidade…"
          onFocus={() => {
            setOpen(true)
            ensureLoaded()
          }}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
            ensureLoaded()
          }}
          onBlur={() => {
            // Atraso p/ permitir o clique numa sugestão antes de fechar.
            blurTimer.current = setTimeout(() => {
              setOpen(false)
              // Descarta texto livre que não foi escolhido da lista.
              setText(value ?? '')
            }, 150)
          }}
          aria-label="Cidade"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            className="btn-ghost shrink-0 px-2 text-xs text-slate-500"
            aria-label="Limpar cidade"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading && <p className="px-3 py-2 text-sm text-slate-400">Carregando cidades…</p>}
          {!loading && term.length < 1 && (
            <p className="px-3 py-2 text-sm text-slate-400">Digite para buscar.</p>
          )}
          {!loading && term.length >= 1 && matches.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-400">Nenhuma cidade encontrada.</p>
          )}
          {matches.map((city) => (
            <button
              key={city}
              type="button"
              // onMouseDown (antes do blur) garante a seleção.
              onMouseDown={(e) => {
                e.preventDefault()
                if (blurTimer.current) clearTimeout(blurTimer.current)
                select(city)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-pitch-50"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
