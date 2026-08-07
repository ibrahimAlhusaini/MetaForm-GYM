import { Activity, Dumbbell, Flame, Gauge, Scale } from 'lucide-react'
import type { DashboardSummaryData } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import {
  formatCalories,
  formatCount,
  formatDateTime,
  formatDuration,
  formatWeight,
} from '../utils/dashboard-formatters.js'
import { MetricCard } from './MetricCard.js'
import { WeeklyProgressCard } from './WeeklyProgressCard.js'

interface OverviewGridProps {
  overview: DashboardSummaryData['overview']
}

export function OverviewGrid({ overview }: OverviewGridProps) {
  const { t } = useTranslation(['dashboard', 'common'])
  const lastWorkout = overview.lastWorkout

  return (
    <section aria-labelledby="overview-title" className="mt-10">
      <div className="mb-5">
        <h2 id="overview-title" className="text-xl font-semibold text-white">
          {t('dashboard:overview.title')}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t('dashboard:overview.description')}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={Scale}
          label={t('dashboard:overview.currentWeight')}
          value={
            overview.currentBodyWeightKg === null
              ? t('common:states.unavailable')
              : formatWeight(overview.currentBodyWeightKg)
          }
          detail={t('dashboard:overview.currentWeightDetail')}
          isUnavailable={overview.currentBodyWeightKg === null}
        />
        <MetricCard
          icon={Gauge}
          label={t('dashboard:overview.dailyMaintenance')}
          value={
            overview.dailyCalories === null
              ? t('common:states.unavailable')
              : formatCalories(overview.dailyCalories)
          }
          detail={t('dashboard:overview.dailyMaintenanceDetail')}
          isUnavailable={overview.dailyCalories === null}
        />
        <MetricCard
          icon={Flame}
          label={t('dashboard:overview.workoutStreak')}
          value={formatCount(overview.currentWorkoutStreak, 'days')}
          detail={t('dashboard:overview.workoutStreakDetail')}
        />
        <MetricCard
          icon={Dumbbell}
          label={t('dashboard:overview.workoutsCompleted')}
          value={formatCount(overview.workoutsCompleted, 'workouts')}
          detail={t('dashboard:overview.workoutsCompletedDetail')}
        />
        <MetricCard
          icon={Activity}
          label={t('dashboard:overview.lastWorkout')}
          value={
            lastWorkout
              ? formatDuration(lastWorkout.durationMinutes)
              : t('dashboard:overview.noData')
          }
          detail={
            lastWorkout
              ? t('dashboard:overview.completedAt', {
                  date: formatDateTime(lastWorkout.completedAt),
                })
              : t('dashboard:overview.completeToSee')
          }
          isUnavailable={!lastWorkout}
        />
        <WeeklyProgressCard progress={overview.weeklyProgress} />
      </div>
    </section>
  )
}
