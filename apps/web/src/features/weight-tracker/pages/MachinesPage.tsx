import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  muscleGroups,
  muscleLabels,
} from '../constants/weight-tracker.constants.js'
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
          <h1 className="text-3xl font-semibold">Custom machines</h1>
          <p className="mt-2 text-zinc-400">
            Manage the equipment available in your workout builder.
          </p>
        </div>
        <Link
          to="new"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
        >
          <Plus className="size-4" />
          Add machine
        </Link>
      </header>
      <section
        aria-label="Machine filters"
        className="mt-7 grid gap-3 rounded-2xl border border-white/8 bg-[#111315] p-4 md:grid-cols-[1fr_13rem_13rem]"
      >
        <label className="relative">
          <span className="sr-only">Search machines</span>
          <Search className="absolute top-3.5 left-3 size-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search machines"
            className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 pr-3 pl-10"
          />
        </label>
        <label>
          <span className="sr-only">Target muscle</span>
          <select
            value={muscle}
            onChange={(e) => {
              setMuscle(e.target.value as MuscleGroup | '')
              setPage(1)
            }}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="">All muscles</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {muscleLabels[group]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort machines</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as NonNullable<MachineQuery['sortBy']>)
            }}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="updatedAt">Recently updated</option>
            <option value="createdAt">Recently created</option>
            <option value="name">Name</option>
          </select>
        </label>
      </section>
      <div className="mt-6">
        {state.status === 'loading' ? (
          <WeightTrackerSkeleton label="Loading machines" />
        ) : state.status === 'error' ? (
          <WeightTrackerErrorState
            message={state.errorMessage}
            onRetry={retry}
          />
        ) : state.data.items.length === 0 ? (
          <EmptyState
            title="No matching machines"
            description="Adjust the filters or add a new custom machine."
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
