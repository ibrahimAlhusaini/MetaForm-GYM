import type { ProfileSummary } from '@metaform/shared-types'
import { UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  activityLabel,
  fitnessGoalLabel,
  genderLabel,
} from '../../../i18n/enum-labels.js'
import { useAppLocale } from '../../../i18n/locale.js'
import type { AsyncState } from '../../weight-tracker/hooks/useAsyncResource.js'
import {
  formatProfileAge,
  formatProfileHeight,
  formatProfilePercentage,
  formatProfileWeight,
} from '../utils/profile-formatters.js'
import { ProfileErrorState, ProfileSkeleton } from './ProfileStates.js'

export function ProfileSummaryCard({
  state,
  onRetry,
}: {
  state: AsyncState<ProfileSummary>
  onRetry: () => void
}) {
  const { t } = useTranslation(['profile', 'common'])
  const locale = useAppLocale()
  if (state.status === 'loading')
    return <ProfileSkeleton label={t('profile:loading.summary')} />
  if (state.status === 'error')
    return (
      <ProfileErrorState
        title={t('profile:errors.summaryTitle')}
        message={state.errorMessage}
        onRetry={onRetry}
      />
    )
  const unavailable = t('common:states.notSpecified')
  const rows = [
    [t('profile:summary.displayName'), state.data.displayName ?? unavailable],
    [
      t('profile:summary.age'),
      state.data.age === null
        ? unavailable
        : formatProfileAge(state.data.age, locale, t),
    ],
    [
      t('profile:summary.gender'),
      state.data.gender ? genderLabel(t, state.data.gender) : unavailable,
    ],
    [
      t('profile:summary.height'),
      state.data.heightCm === null
        ? unavailable
        : formatProfileHeight(state.data.heightCm, locale, t),
    ],
    [
      t('profile:summary.weight'),
      state.data.currentWeightKg === null
        ? unavailable
        : formatProfileWeight(state.data.currentWeightKg, locale, t),
    ],
    [
      t('profile:summary.activity'),
      state.data.activityLevel
        ? activityLabel(t, state.data.activityLevel)
        : unavailable,
    ],
    [
      t('profile:summary.goal'),
      state.data.fitnessGoal
        ? fitnessGoalLabel(t, state.data.fitnessGoal)
        : unavailable,
    ],
    [
      t('profile:summary.completeness'),
      formatProfilePercentage(state.data.completeness.percentage, locale, t),
    ],
  ]
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111315] p-5">
      <div className="flex items-center gap-3">
        <UserRound className="size-5 text-lime-300" aria-hidden="true" />
        <h2 className="font-semibold">{t('profile:summary.title')}</h2>
      </div>
      <dl className="mt-4 divide-y divide-white/10">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="text-end font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
