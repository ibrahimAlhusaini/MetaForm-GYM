import { Dumbbell } from 'lucide-react'
import type { StrengthProgressItem } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import { SectionEmptyState } from './SectionEmptyState.js'
import { StrengthProgressCard } from './StrengthProgressCard.js'

interface StrengthProgressSectionProps {
  machines: readonly StrengthProgressItem[]
}

export function StrengthProgressSection({
  machines,
}: StrengthProgressSectionProps) {
  const { t } = useTranslation('dashboard')
  return (
    <section aria-labelledby="strength-progress-title" className="mt-10">
      <div className="mb-5">
        <h2
          id="strength-progress-title"
          className="text-xl font-semibold text-white"
        >
          {t('strength.title')}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
          {t('strength.description')}
        </p>
      </div>

      {machines.length === 0 ? (
        <SectionEmptyState
          icon={Dumbbell}
          title={t('strength.emptyTitle')}
          description={t('strength.emptyDescription')}
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
