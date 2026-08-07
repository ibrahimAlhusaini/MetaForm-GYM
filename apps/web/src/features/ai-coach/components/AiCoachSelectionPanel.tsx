import type { AiCoachCapabilityType } from '@metaform/shared-types'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  AiCoachGenerationError,
  AiCoachSelectionState,
} from '../types/ai-coach.types.js'
import { AiCoachPlanPicker } from './AiCoachPlanPicker.js'
import { AiCoachSourcePicker } from './AiCoachSourcePicker.js'

export function AiCoachSelectionPanel({
  type,
  selection,
  pending,
  error,
  validationError,
  onSelectionChange,
  onGenerate,
}: {
  type: AiCoachCapabilityType
  selection: AiCoachSelectionState
  pending: boolean
  error: AiCoachGenerationError
  validationError: boolean
  onSelectionChange: (selection: AiCoachSelectionState) => void
  onGenerate: () => void
}) {
  const { t } = useTranslation('aiCoach')
  const needsSource =
    type === 'PLATEAU_DETECTION' || type === 'NEXT_WORKOUT_GUIDANCE'
  const needsPlan = type === 'WORKOUT_PLAN_REVIEW'
  return (
    <section
      aria-labelledby="coach-selection-title"
      className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6"
    >
      <h2 id="coach-selection-title" className="text-xl font-semibold">
        {t(`capabilities.${type}.title`)}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        {t('selection.description')}
      </p>
      <div className="mt-5">
        {needsSource ? (
          <AiCoachSourcePicker
            selection={selection}
            onChange={onSelectionChange}
          />
        ) : null}
        {needsPlan ? (
          <AiCoachPlanPicker
            selection={selection}
            onChange={onSelectionChange}
          />
        ) : null}
        {!needsSource && !needsPlan ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-300">
            {t('selection.noInput')}
          </p>
        ) : null}
      </div>
      {validationError ? (
        <p role="alert" className="mt-3 text-sm text-amber-200">
          {t(
            needsPlan ? 'validation.planRequired' : 'validation.sourceRequired',
          )}
        </p>
      ) : null}
      <div aria-live="polite" className="mt-3 min-h-6 text-sm">
        {pending ? (
          <p role="status" className="text-lime-200">
            {t('generation.analyzing')}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-amber-200">
            {t(
              error === 'unavailable'
                ? 'errors.unavailable'
                : 'errors.generation',
            )}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={pending}
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles
          className={`size-5 ${pending ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
        {t(pending ? 'generation.pending' : 'generation.action')}
      </button>
      <p className="mt-3 text-xs leading-5 text-zinc-500">
        {t('generation.privacy')}
      </p>
    </section>
  )
}
