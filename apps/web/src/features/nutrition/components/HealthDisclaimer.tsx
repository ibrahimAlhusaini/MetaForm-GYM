import { HeartPulse } from 'lucide-react'
import { HEALTH_DISCLAIMER } from '../constants/nutrition.constants.js'

export function HealthDisclaimer() {
  return (
    <aside
      aria-label="Health disclaimer"
      className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm leading-6 text-zinc-400"
    >
      <HeartPulse
        className="mt-0.5 size-5 shrink-0 text-lime-300"
        aria-hidden="true"
      />
      <div>
        <h2 className="font-semibold text-zinc-100">Health disclaimer</h2>
        <p className="mt-1">
          {HEALTH_DISCLAIMER} Individual needs vary; consult a qualified
          professional for personalized health guidance.
        </p>
      </div>
    </aside>
  )
}
