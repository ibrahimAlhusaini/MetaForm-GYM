import type { WorkoutPlanSummary } from '@metaform/shared-types'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { ClonePlanDialog } from '../components/ClonePlanDialog.js'
import { DeletePlanDialog } from '../components/DeletePlanDialog.js'
import { WorkoutPlanCard } from '../components/WorkoutPlanCard.js'
import {
  WorkoutPlanEmpty,
  WorkoutPlanError,
  WorkoutPlanLoading,
} from '../components/WorkoutPlanStates.js'
import { WorkoutPlanFilters } from '../components/WorkoutPlanFilters.js'
import { useWorkoutPlans } from '../hooks/useWorkoutPlans.js'
import { useWorkoutPlanMutations } from '../hooks/useWorkoutPlanMutations.js'
import {
  cloneWorkoutPlan,
  deleteWorkoutPlan,
} from '../services/workout-plans.service.js'
import type {
  PlanFiltersState,
  WorkoutPlanQuery,
} from '../types/workout-plans.types.js'
import { PLAN_PAGE_SIZE } from '../utils/workout-plan-query.js'

const initialFilters = (mine: boolean): PlanFiltersState => ({
  search: '',
  difficultyLevel: '',
  isTemplate: '',
  sortBy: mine ? 'updatedAt' : 'name',
  sortOrder: mine ? 'desc' : 'asc',
})

export function WorkoutPlansPage() {
  const { t } = useTranslation('workoutPlans')
  const navigate = useNavigate()
  const [tab, setTab] = useState<'ready' | 'mine'>('ready')
  const mine = tab === 'mine'
  const [filters, setFilters] = useState(() => initialFilters(false))
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cloneTarget, setCloneTarget] = useState<WorkoutPlanSummary | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<WorkoutPlanSummary | null>(
    null,
  )
  const mutations = useWorkoutPlanMutations()
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(filters.search)
      setPage(1)
    }, 350)
    return () => {
      window.clearTimeout(timer)
    }
  }, [filters.search])
  const query = useMemo<WorkoutPlanQuery>(
    () => ({
      page,
      limit: PLAN_PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(filters.difficultyLevel
        ? { difficultyLevel: filters.difficultyLevel }
        : {}),
      ...(mine && filters.isTemplate
        ? { isTemplate: filters.isTemplate === 'true' }
        : {}),
      ...(mine ? { ownership: 'mine' as const } : {}),
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
    [
      filters.difficultyLevel,
      filters.isTemplate,
      filters.sortBy,
      filters.sortOrder,
      mine,
      page,
      search,
    ],
  )
  const plans = useWorkoutPlans(query, !mine)
  const changeTab = (next: 'ready' | 'mine') => {
    setTab(next)
    setFilters(initialFilters(next === 'mine'))
    setSearch('')
    setPage(1)
  }
  const updateFilters = (next: PlanFiltersState) => {
    setFilters(next)
    if (next.search === filters.search) setPage(1)
  }
  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-lime-300 uppercase">
            {t('header.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            {t('header.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            {t('header.description')}
          </p>
        </div>
        <Link
          to="/app/plans/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
        >
          <Plus className="size-4" />
          {t('header.create')}
        </Link>
      </header>
      <div
        role="tablist"
        aria-label={t('tabs.label')}
        className="mt-8 inline-grid grid-cols-2 rounded-xl border border-white/10 bg-[#111315] p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!mine}
          onClick={() => {
            changeTab('ready')
          }}
          className={`min-h-10 rounded-lg px-5 font-semibold ${!mine ? 'bg-lime-300 text-zinc-950' : 'text-zinc-400'}`}
        >
          {t('tabs.ready')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mine}
          onClick={() => {
            changeTab('mine')
          }}
          className={`min-h-10 rounded-lg px-5 font-semibold ${mine ? 'bg-lime-300 text-zinc-950' : 'text-zinc-400'}`}
        >
          {t('tabs.mine')}
        </button>
      </div>
      <div className="mt-5">
        <WorkoutPlanFilters
          value={filters}
          mine={mine}
          onChange={updateFilters}
        />
      </div>
      <div className="mt-6" aria-live="polite">
        {plans.state.status === 'loading' ? (
          <WorkoutPlanLoading />
        ) : plans.state.status === 'error' ? (
          <WorkoutPlanError
            message={plans.state.errorMessage}
            onRetry={plans.retry}
          />
        ) : plans.state.data.items.length === 0 ? (
          <WorkoutPlanEmpty mine={mine} />
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {plans.state.data.items.map((plan) => (
                <WorkoutPlanCard
                  key={plan.id}
                  plan={plan}
                  owned={plan.ownershipType === 'USER'}
                  onClone={setCloneTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
            <nav
              aria-label={t('pagination.label')}
              className="mt-6 flex items-center justify-between gap-4"
            >
              <button
                type="button"
                disabled={!plans.state.data.pagination.hasPreviousPage}
                onClick={() => {
                  setPage((value) => value - 1)
                }}
                className="min-h-10 rounded-lg border border-white/10 px-4 disabled:opacity-40"
              >
                {t('pagination.previous')}
              </button>
              <span className="text-sm text-zinc-400">
                {t('pagination.page', {
                  page: plans.state.data.pagination.page,
                  total: plans.state.data.pagination.totalPages,
                })}
              </span>
              <button
                type="button"
                disabled={!plans.state.data.pagination.hasNextPage}
                onClick={() => {
                  setPage((value) => value + 1)
                }}
                className="min-h-10 rounded-lg border border-white/10 px-4 disabled:opacity-40"
              >
                {t('pagination.next')}
              </button>
            </nav>
          </>
        )}
      </div>
      {mutations.error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-400/20 p-4 text-red-200"
        >
          {mutations.error}
        </p>
      ) : null}
      <ClonePlanDialog
        key={cloneTarget?.id ?? 'none'}
        plan={cloneTarget}
        pending={mutations.pending}
        onClose={() => {
          setCloneTarget(null)
        }}
        onConfirm={(name) => {
          if (!cloneTarget) return
          void mutations
            .run(
              () =>
                cloneWorkoutPlan(
                  cloneTarget.id,
                  name.trim() ? { name: name.trim() } : {},
                ),
              t('errors.clone'),
            )
            .then((created) => {
              if (created) void navigate(`/app/plans/${created.id}`)
            })
        }}
      />
      <DeletePlanDialog
        plan={deleteTarget}
        pending={mutations.pending}
        onClose={() => {
          setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (!deleteTarget) return
          void mutations
            .run(() => deleteWorkoutPlan(deleteTarget.id), t('errors.delete'))
            .then((result) => {
              if (result !== null) {
                setDeleteTarget(null)
                plans.retry()
              }
            })
        }}
      />
    </div>
  )
}
