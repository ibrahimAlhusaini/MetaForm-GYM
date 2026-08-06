import { Activity, Dumbbell, Flame, Gauge, Scale } from 'lucide-react'
import type { DashboardSummaryData } from '@metaform/shared-types'
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
  const lastWorkout = overview.lastWorkout

  return (
    <section aria-labelledby="overview-title" className="mt-10">
      <div className="mb-5">
        <h2 id="overview-title" className="text-xl font-semibold text-white">
          Overview
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Your latest available training summary.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={Scale}
          label="Current body weight"
          value={
            overview.currentBodyWeightKg === null
              ? 'Not available'
              : formatWeight(overview.currentBodyWeightKg)
          }
          detail="Latest measurement or profile snapshot"
          isUnavailable={overview.currentBodyWeightKg === null}
        />
        <MetricCard
          icon={Gauge}
          label="Daily maintenance"
          value={
            overview.dailyCalories === null
              ? 'Not available'
              : formatCalories(overview.dailyCalories)
          }
          detail="Most recent saved nutrition calculation"
          isUnavailable={overview.dailyCalories === null}
        />
        <MetricCard
          icon={Flame}
          label="Workout streak"
          value={formatCount(overview.currentWorkoutStreak, 'days')}
          detail="Consecutive completed workout days"
        />
        <MetricCard
          icon={Dumbbell}
          label="Workouts completed"
          value={formatCount(overview.workoutsCompleted, 'workouts')}
          detail="All completed workout sessions"
        />
        <MetricCard
          icon={Activity}
          label="Last workout"
          value={
            lastWorkout
              ? formatDuration(lastWorkout.durationMinutes)
              : 'No data yet'
          }
          detail={
            lastWorkout
              ? `Completed ${formatDateTime(lastWorkout.completedAt)}`
              : 'Complete a workout to see it here'
          }
          isUnavailable={!lastWorkout}
        />
        <WeeklyProgressCard progress={overview.weeklyProgress} />
      </div>
    </section>
  )
}
