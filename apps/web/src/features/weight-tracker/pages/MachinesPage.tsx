import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { muscleLabel } from '../../../i18n/enum-labels.js'
import { muscleGroups } from '../constants/weight-tracker.constants.js'
import { useMachines } from '../hooks/useMachines.js'
import type {
  MachineQuery,
  MuscleGroup,
} from '../types/weight-tracker.types.js'
import {
  EmptyState,
  WeightTrackerErrorState,
  WeightTrackerSkeleton,
} from '../components/AsyncStates.js'
import { MachineCard } from '../components/MachineCard.js'
import { PaginationControls } from '../components/PaginationControls.js'

export function MachinesPage() {
  const { t } = useTranslation('weightTracker')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | ''>('')
  const [sort, setSort] =
    useState<NonNullable<MachineQuery['sortBy']>>('updatedAt')
  const query = useMemo<MachineQuery>(
    () => ({
      page,
      ...(search ? { search } : {}),
      ...(muscle ? { targetMuscle: muscle } : {}),
      sortBy: sort,
      sortOrder: sort === 'name' ? ('asc' as const) : ('desc' as const),
    }),
    [muscle, page, search, sort],
  )
  const { state, retry } = useMachines(query)
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('machines.title')}</h1>
          <p className="mt-2 text-zinc-400">{t('machines.description')}</p>
        </div>
        <Link
          to="new"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
        >
          <Plus className="size-4" />
          {t('machines.add')}
        </Link>
      </header>
      <section
        aria-label={t('machines.filters')}
        className="mt-7 grid gap-3 rounded-2xl border border-white/8 bg-[#111315] p-4 md:grid-cols-[1fr_13rem_13rem]"
      >
        <label className="relative">
          <span className="sr-only">{t('machines.search')}</span>
          <Search className="absolute start-3 top-3.5 size-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('machines.search')}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 ps-10 pe-3"
          />
        </label>
        <label>
          <span className="sr-only">{t('machines.targetMuscle')}</span>
          <select
            value={muscle}
            onChange={(e) => {
              setMuscle(e.target.value as MuscleGroup | '')
              setPage(1)
            }}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="">{t('machines.allMuscles')}</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {muscleLabel(t, group)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t('machines.sort')}</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as NonNullable<MachineQuery['sortBy']>)
            }}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="updatedAt">{t('machines.updated')}</option>
            <option value="createdAt">{t('machines.created')}</option>
            <option value="name">{t('machines.name')}</option>
          </select>
        </label>
      </section>
      <div className="mt-6">
        {state.status === 'loading' ? (
          <WeightTrackerSkeleton label={t('loading.machines')} />
        ) : state.status === 'error' ? (
          <WeightTrackerErrorState
            message={state.errorMessage}
            onRetry={retry}
          />
        ) : state.data.items.length === 0 ? (
          <EmptyState
            title={t('machines.emptyTitle')}
            description={t('machines.emptyDescription')}
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {state.data.items.map((machine) => (
                <MachineCard key={machine.id} machine={machine} />
              ))}
            </div>
            <div className="mt-6">
              <PaginationControls
                pagination={state.data.pagination}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
