import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Pagination } from '../types/weight-tracker.types.js'
import { paginationLabel } from '../utils/formatters.js'

export function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: Pagination
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation(['weightTracker', 'common'])
  return (
    <nav
      aria-label={t('common:pagination.label')}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5"
    >
      <p className="text-sm text-zinc-400">
        {paginationLabel(pagination.page, pagination.totalPages)} ·{' '}
        {t('weightTracker:pagination.items', { count: pagination.totalItems })}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!pagination.hasPreviousPage}
          onClick={() => {
            onPageChange(pagination.page - 1)
          }}
          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm disabled:opacity-40"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
          {t('common:actions.previous')}
        </button>
        <button
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={() => {
            onPageChange(pagination.page + 1)
          }}
          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm disabled:opacity-40"
        >
          {t('common:actions.next')}
          <ChevronRight className="size-4 rtl:rotate-180" />
        </button>
      </div>
    </nav>
  )
}
