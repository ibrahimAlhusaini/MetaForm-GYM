import type { AiCoachCapabilityDefinition } from '@metaform/shared-types'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { capabilityPresentation } from '../constants/ai-coach.constants.js'

export function AiCoachCapabilityCard({
  capability,
  selected,
  onSelect,
}: {
  capability: AiCoachCapabilityDefinition
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation('aiCoach')
  const presentation = capabilityPresentation[capability.type]
  const Icon = presentation.icon
  return (
    <article
      className={`flex h-full flex-col rounded-2xl border p-5 transition ${selected ? 'border-lime-300/60 bg-lime-300/[0.07]' : 'border-white/10 bg-white/[0.025] hover:border-white/20'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {capability.requires.exerciseSource ||
        capability.requires.workoutPlan ? (
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400">
            {t('capabilities.selectionRequired')}
          </span>
        ) : null}
      </div>
      <h3 className="mt-5 text-lg font-semibold">
        {t(`capabilities.${capability.type}.title`)}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
        {t(`capabilities.${capability.type}.description`)}
      </p>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="mt-5 flex min-h-11 w-full items-center justify-between rounded-xl border border-white/10 px-4 font-semibold outline-none hover:border-lime-300/40 focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        {t(selected ? 'capabilities.selected' : 'capabilities.choose')}
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
      </button>
    </article>
  )
}
