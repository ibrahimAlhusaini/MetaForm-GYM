import type { ProfileCompleteness } from '@metaform/shared-types'
import { CheckCircle2, CircleDashed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppLocale } from '../../../i18n/locale.js'
import type { AsyncState } from '../../weight-tracker/hooks/useAsyncResource.js'
import { formatProfilePercentage } from '../utils/profile-formatters.js'
import { ProfileErrorState, ProfileSkeleton } from './ProfileStates.js'

export function ProfileCompletenessCard({
  state,
  onRetry,
}: {
  state: AsyncState<ProfileCompleteness>
  onRetry: () => void
}) {
  const { t } = useTranslation(['profile', 'common'])
  const locale = useAppLocale()
  if (state.status === 'loading')
    return <ProfileSkeleton label={t('profile:loading.completeness')} />
  if (state.status === 'error')
    return (
      <ProfileErrorState
        title={t('profile:errors.completenessTitle')}
        message={state.errorMessage}
        onRetry={onRetry}
      />
    )
  const formatted = formatProfilePercentage(state.data.percentage, locale, t)
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111315] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{t('profile:completeness.title')}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {state.data.complete
              ? t('profile:completeness.complete')
              : t('profile:completeness.incomplete')}
          </p>
        </div>
        {state.data.complete ? (
          <CheckCircle2 className="size-6 text-lime-300" aria-hidden="true" />
        ) : (
          <CircleDashed className="size-6 text-zinc-400" aria-hidden="true" />
        )}
      </div>
      <p className="mt-5 text-3xl font-semibold" dir="ltr">
        {formatted}
      </p>
      <progress
        className="mt-3 h-2 w-full accent-lime-300"
        max={100}
        value={state.data.percentage}
        aria-label={t('profile:completeness.progressLabel', {
          percentage: formatted,
        })}
      />
      {state.data.missingFields.length ? (
        <div className="mt-4">
          <p className="text-sm font-medium">
            {t('profile:completeness.missingTitle')}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
            {state.data.missingFields.map((field) => (
              <li key={field}>{t(`profile:fields.${field}`)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">
          {t('profile:completeness.allSet')}
        </p>
      )}
    </section>
  )
}
