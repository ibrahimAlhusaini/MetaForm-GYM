import { ArrowRight, CircleCheck, Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { SessionSummary } from '../types/weight-tracker.types.js'
import {
  formatDate,
  formatDuration,
  formatVolume,
  sessionStatus,
} from '../utils/formatters.js'

export function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  const { t } = useTranslation('weightTracker')
  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const exercises = t('sessions.exercises', {
          count: session.exerciseLogCount,
        })
        const sets = t('sessions.sets', { count: session.totalSetCount })
        return (
          <article
            key={session.id}
            className="rounded-2xl border border-white/8 bg-[#111315] p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {formatDate(session.startedAt)}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${session.completedAt ? 'bg-lime-300/10 text-lime-300' : 'bg-amber-300/10 text-amber-200'}`}
                  >
                    {sessionStatus(session.completedAt)}
                  </span>
                </div>
                {session.notes ? (
                  <p className="mt-2 truncate text-sm text-zinc-400">
                    {session.notes}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-4" />
                    {formatDuration(session.durationMinutes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CircleCheck className="size-4" />
                    {t('sessions.exercisesSets', { exercises, sets })}
                  </span>
                  <span>
                    {t('sessions.volume', {
                      value: formatVolume(session.totalVolumeKg),
                    })}
                  </span>
                </div>
              </div>
              <Link
                to={`/app/weights/sessions/${session.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold hover:border-lime-300/30 hover:text-lime-300"
              >
                {t('sessions.open')}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </div>
          </article>
        )
      })}
    </div>
  )
}
