import { Award, BarChart3, Dumbbell, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import {
  EmptyState,
  WeightTrackerErrorState,
  WeightTrackerSkeleton,
} from '../components/AsyncStates.js'
import { HistoryChart } from '../components/HistoryChart.js'
import { MachineImage } from '../components/MachineImage.js'
import { PaginationControls } from '../components/PaginationControls.js'
import { StrengthPredictionCard } from '../components/StrengthPredictionCard.js'
import { useSourceHistory } from '../hooks/useSourceHistory.js'
import { useStrengthPrediction } from '../hooks/useStrengthPrediction.js'
import type {
  SourceHistory,
  SourceType,
} from '../types/weight-tracker.types.js'
import {
  formatDate,
  formatKg,
  formatMuscle,
  formatSourceType,
  formatVolume,
} from '../utils/formatters.js'

const isSourceType = (value: string | undefined): value is SourceType =>
  value === 'exercise' || value === 'machine'
function StatCards({ history }: { history: SourceHistory }) {
  const { t } = useTranslation('weightTracker')
  const stats = [
    {
      label: t('history.personalRecord'),
      value: formatKg(history.personalRecordKg),
      icon: Award,
    },
    {
      label: t('history.average'),
      value: formatKg(history.averageRepresentativeWeightKg),
      icon: BarChart3,
    },
    {
      label: t('history.latest'),
      value: formatKg(history.latestRepresentativeWeightKg),
      icon: Dumbbell,
    },
    {
      label: t('history.previous'),
      value: formatKg(history.previousRepresentativeWeightKg),
      icon: Dumbbell,
    },
    {
      label: t('history.improvement'),
      value: formatKg(history.bestImprovementKg),
      icon: TrendingUp,
    },
    {
      label: t('history.completed'),
      value: t('history.completedValue', {
        sessions: t('history.sessions', { count: history.totalSessions }),
        sets: t('history.sets', { count: history.totalSets }),
      }),
      icon: BarChart3,
    },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <article
          key={label}
          className="rounded-2xl border border-white/8 bg-[#111315] p-5"
        >
          <Icon className="size-5 text-lime-300" />
          <p className="mt-4 text-sm text-zinc-500">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </article>
      ))}
    </div>
  )
}
export function SourceHistoryPage() {
  const { t } = useTranslation('weightTracker')
  const params = useParams()
  const [page, setPage] = useState(1)
  const sourceType = isSourceType(params.sourceType)
    ? params.sourceType
    : 'machine'
  const sourceId = params.sourceId ?? ''
  const { state, retry } = useSourceHistory(sourceType, sourceId, page)
  const prediction = useStrengthPrediction(sourceType, sourceId)
  if (!isSourceType(params.sourceType) || !sourceId)
    return (
      <WeightTrackerErrorState
        message={t('errors.invalidHistory')}
        onRetry={() => undefined}
      />
    )
  if (state.status === 'loading')
    return <WeightTrackerSkeleton label={t('loading.history')} />
  if (state.status === 'error')
    return (
      <WeightTrackerErrorState message={state.errorMessage} onRetry={retry} />
    )
  const history = state.data
  return (
    <div>
      <header className="grid gap-5 rounded-2xl border border-white/8 bg-[#111315] p-5 sm:grid-cols-[8rem_1fr] sm:items-center">
        <MachineImage
          imageUrl={history.source.imageUrl ?? null}
          name={history.source.name}
          className="aspect-square w-full rounded-xl"
        />
        <div>
          <Link to="/app/weights/machines" className="text-sm text-lime-300">
            {t('history.back')}
          </Link>
          <p className="mt-3 text-sm font-semibold tracking-wider text-zinc-500 uppercase">
            {formatSourceType(history.source.type)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold">{history.source.name}</h1>
          <p className="mt-2 text-zinc-400">
            {formatMuscle(history.source.targetMuscle)}
          </p>
        </div>
      </header>
      <div className="mt-6">
        <StrengthPredictionCard
          state={prediction.state}
          onRetry={prediction.retry}
        />
      </div>
      {history.totalSessions === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t('history.emptyTitle')}
            description={t('history.emptyDescription')}
          />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <StatCards history={history} />
          </div>
          <div className="mt-6">
            <HistoryChart
              points={history.chartPoints}
              sourceName={history.source.name}
            />
          </div>
          <section className="mt-6 rounded-2xl border border-white/8 bg-[#111315] p-5">
            <h2 className="text-xl font-semibold">
              {t('history.previousSessions')}
            </h2>
            <div className="mt-4 space-y-3">
              {history.sessions.items.map((session) => (
                <article
                  key={session.workoutSessionId}
                  className="flex flex-col gap-3 rounded-xl border border-white/7 bg-black/15 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {formatDate(session.startedAt)}
                    </p>
                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {session.notes ?? t('history.noNotes')}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm sm:text-end">
                    <div>
                      <p className="text-zinc-500">
                        {t('history.representative')}
                      </p>
                      <p className="font-semibold">
                        {formatKg(session.representativeWeightKg)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">{t('historyLabels.sets')}</p>
                      <p className="font-semibold">
                        {t('history.workingSets', {
                          count: session.workingSets,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">{t('history.volume')}</p>
                      <p className="font-semibold">
                        {formatVolume(session.estimatedVolumeKg)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-5">
              <PaginationControls
                pagination={history.sessions.pagination}
                onPageChange={setPage}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
