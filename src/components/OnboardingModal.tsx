/**
 * Mini tutorial em passos. Controlado por useOnboardingStore (open/finish).
 * Renderizado uma vez no Layout; some quando não está aberto.
 */
import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/store/onboardingStore'

interface Step {
  emoji: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    emoji: '⚽',
    title: 'Bem-vindo ao Club Manager!',
    body: 'Transforme a planilha da pelada num painel: artilharia, assistências, presença e aproveitamento — igual time profissional.',
  },
  {
    emoji: '🛡️',
    title: '1. Crie seu time',
    body: 'Em "Meus Times", toque em + Criar time. Dê nome, escolha a cor, a cidade e um telefone de contato (para marcar amistosos/treinos).',
  },
  {
    emoji: '👕',
    title: '2. Monte o elenco',
    body: 'Na aba Elenco, adicione os jogadores com posição, número e foto. Quem sai do time vira "inativo" — o histórico é preservado.',
  },
  {
    emoji: '📅',
    title: '3. Registre os jogos',
    body: 'Na aba Jogos, lance o placar, marque presença e atribua os gols/assistências. Funciona até sem internet — sincroniza depois.',
  },
  {
    emoji: '📊',
    title: '4. Acompanhe e compartilhe',
    body: 'Veja gráficos e rankings na aba Estatísticas, gere cards de imagem para postar no grupo e compartilhe o link público do time.',
  },
]

export function OnboardingModal() {
  const open = useOnboardingStore((s) => s.open)
  const finish = useOnboardingStore((s) => s.finish)
  const [step, setStep] = useState(0)

  // Reinicia no primeiro passo sempre que abrir.
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, finish])

  if (!open) return null

  const isLast = step === STEPS.length - 1
  const s = STEPS[step]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={finish}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl" aria-hidden>
          {s.emoji}
        </div>
        <h2 className="mt-3 text-lg font-extrabold text-slate-900">{s.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{s.body}</p>

        {/* Indicadores de passo */}
        <div className="mt-5 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-5 bg-pitch-600' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <button onClick={finish} className="btn-ghost text-sm text-slate-500">
            Pular
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep((v) => v - 1)} className="btn-ghost border border-slate-300 text-sm">
                Voltar
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep((v) => v + 1))}
              className="btn-primary text-sm"
            >
              {isLast ? 'Começar!' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
