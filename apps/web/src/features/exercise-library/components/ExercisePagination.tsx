import type { ExercisePagination as Pagination } from '@metaform/shared-types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { paginationLabels } from '../constants/exercise-library.constants.js'

export function ExercisePagination({
  pagination,
  onPageChange,
}: {
  pagination: Pagination
  onPageChange: (page: number) => void
}) {
  if (pagination.totalPages <= 1) return null
  return (
    <nav
      aria-label="Exercise pages"
      className="mt-8 flex items-center justify-between gap-4"
    >
      <button
        type="button"
        disabled={!pagination.hasPreviousPage}
        onClick={() => {
          onPageChange(pagination.page - 1)
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 font-semibold disabled:opacity-35"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        {paginationLabels.previous}
      </button>
      <p className="text-sm text-zinc-400">
        Page <span className="font-semibold text-white">{pagination.page}</span>{' '}
        of {pagination.totalPages}
      </p>
      <button
        type="button"
        disabled={!pagination.hasNextPage}
        onClick={() => {
          onPageChange(pagination.page + 1)
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 font-semibold disabled:opacity-35"
      >
        {paginationLabels.next}
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
