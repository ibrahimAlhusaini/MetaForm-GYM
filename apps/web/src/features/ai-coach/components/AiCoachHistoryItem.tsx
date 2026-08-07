import type { AiCoachSessionSummary } from '@metaform/shared-types'
import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppLocale } from '../../../i18n/locale.js'
import {
  capabilityLabel,
  coachStatusLabel,
  formatAiCoachDate,
} from '../utils/ai-coach-formatters.js'

export function AiCoachHistoryItem({
  session,
}: {
  session: AiCoachSessionSummary
}) {
  const { t } = useTranslation('aiCoach')
  const locale = useAppLocale()
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-lime-300 uppercase">
            {capabilityLabel(t, session.type)}
          </p>
          <h3 className="mt-2 font-semibold">
            {session.headline ?? t('history.noHeadline')}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-300">
          {coachStatusLabel(t, session.status)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {formatAiCoachDate(session.completedAt ?? session.startedAt, locale)}
        </span>
        <span lang={session.language}>
          {t(`languages.${session.language}`)}
        </span>
      </div>
      <Link
        to={`/app/ai-coach/sessions/${session.id}`}
        className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-lime-300 outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        {t('history.open')}
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
      </Link>
    </article>
  )
}
