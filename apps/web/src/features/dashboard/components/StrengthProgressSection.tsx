import { Dumbbell } from 'lucide-react'
import type { StrengthProgressItem } from '@metaform/shared-types'
import { SectionEmptyState } from './SectionEmptyState.js'
import { StrengthProgressCard } from './StrengthProgressCard.js'

interface StrengthProgressSectionProps {
  machines: readonly StrengthProgressItem[]
}

export function StrengthProgressSection({
  machines,
}: StrengthProgressSectionProps) {
  return (
    <section aria-labelledby="strength-progress-title" className="mt-10">
      <div className="mb-5">
        <h2
          id="strength-progress-title"
          className="text-xl font-semibold text-white"
        >
          Strength progress
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
          Maximum qualifying load from each completed training session.
        </p>
      </div>

      {machines.length === 0 ? (
        <SectionEmptyState
          icon={Dumbbell}
          title="No strength history yet"
          description="Completed weighted exercises will appear here after workout logging is introduced."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {machines.map((machine) => (
            <StrengthProgressCard
              key={`${machine.sourceType}:${machine.sourceId}`}
              item={machine}
            />
          ))}
        </div>
      )}
    </section>
  )
}
