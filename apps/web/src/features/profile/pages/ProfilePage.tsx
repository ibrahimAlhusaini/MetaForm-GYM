import type { ProfileDetail } from '@metaform/shared-types'
import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppLocale } from '../../../i18n/locale.js'
import { ProfileCompletenessCard } from '../components/ProfileCompletenessCard.js'
import { ProfileForm } from '../components/ProfileForm.js'
import {
  ProfileErrorState,
  ProfileSkeleton,
} from '../components/ProfileStates.js'
import { ProfileSummaryCard } from '../components/ProfileSummaryCard.js'
import { useProfile } from '../hooks/useProfile.js'
import { useProfileCompleteness } from '../hooks/useProfileCompleteness.js'
import { useProfileMutation } from '../hooks/useProfileMutation.js'
import { useProfileSummary } from '../hooks/useProfileSummary.js'
import { formatProfilePercentage } from '../utils/profile-formatters.js'

export function ProfilePage() {
  const { t } = useTranslation('profile')
  const locale = useAppLocale()
  const profile = useProfile()
  const completeness = useProfileCompleteness()
  const summary = useProfileSummary()
  const mutation = useProfileMutation()
  const completion =
    completeness.state.status === 'success'
      ? t('header.completion', {
          percentage: formatProfilePercentage(
            completeness.state.data.percentage,
            locale,
            t,
          ),
        })
      : null
  const saved = (updated: ProfileDetail) => {
    profile.accept(updated)
    completeness.retry()
    summary.retry()
  }
  return (
    <div>
      <header>
        <p className="text-sm font-semibold tracking-[0.18em] text-lime-300 uppercase">
          {t('header.eyebrow')}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('header.title')}
            </h1>
            {summary.state.status === 'success' &&
            summary.state.data.displayName ? (
              <p className="mt-2 text-lg text-zinc-300">
                {summary.state.data.displayName}
              </p>
            ) : null}
          </div>
          {completion ? (
            <p className="rounded-full border border-lime-300/20 bg-lime-300/5 px-3 py-1.5 text-sm font-medium text-lime-200">
              {completion}
            </p>
          ) : null}
        </div>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-400">
          {t('header.description')}
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
        <section aria-label={t('regions.form')}>
          {profile.state.status === 'loading' ? (
            <ProfileSkeleton label={t('loading.profile')} />
          ) : null}
          {profile.state.status === 'error' ? (
            <ProfileErrorState
              title={t('errors.profileTitle')}
              message={profile.state.errorMessage}
              onRetry={profile.retry}
            />
          ) : null}
          {profile.state.status === 'success' ? (
            <ProfileForm
              profile={profile.state.data}
              pending={mutation.pending}
              errorMessage={mutation.errorMessage}
              successMessage={mutation.successMessage}
              onSubmit={mutation.submit}
              onSave={saved}
            />
          ) : null}
        </section>
        <aside aria-label={t('regions.sidebar')} className="space-y-6">
          <ProfileCompletenessCard
            state={completeness.state}
            onRetry={completeness.retry}
          />
          <ProfileSummaryCard state={summary.state} onRetry={summary.retry} />
        </aside>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Info className="size-5 text-lime-300" aria-hidden="true" />
          <h2 className="font-semibold">{t('context.title')}</h2>
        </div>
        <div className="mt-3 grid gap-3 text-sm leading-6 text-zinc-400 md:grid-cols-2">
          <p>{t('context.nutrition')}</p>
          <p>{t('context.dashboard')}</p>
        </div>
      </section>
    </div>
  )
}
