import { CalendarCheck2 } from 'lucide-react'
import type { DashboardWeeklyProgress } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import {
  formatCount,
  formatSignedPercentage,
} from '../utils/dashboard-formatters.js'

interface WeeklyProgressCardProps {
  progress: DashboardWeeklyProgress
}

export function WeeklyProgressCard({ progress }: WeeklyProgressCardProps) {
  const { t } = useTranslation('dashboard')
  const comparison =
    progress.percentageChange === null
      ? t('overview.newActivity')
      : t('overview.versusPrevious', {
          percentage: formatSignedPercentage(progress.percentageChange),
        })

  return (
    <article className="rounded-2xl border border-white/8 bg-[#111315] p-5 sm:col-span-2 xl:col-span-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-zinc-500 uppercase">
            {t('overview.weeklyProgress')}
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white">
            {formatCount(progress.completedWorkouts, 'workouts')}
          </p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl border border-lime-300/10 bg-lime-300/6 text-lime-300">
          <CalendarCheck2
            className="size-[1.15rem]"
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </span>
      </div>
      <div className="mt-4 border-t border-white/7 pt-4 text-sm text-zinc-500">
        <p>{comparison}</p>
        <p className="mt-1">
          {t('overview.previousWeek', {
            count: formatCount(
              progress.previousWeekCompletedWorkouts,
              'workouts',
            ),
          })}
        </p>
      </div>
    </article>
  )
}
