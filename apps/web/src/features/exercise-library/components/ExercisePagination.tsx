import type { ExercisePagination as Pagination } from '@metaform/shared-types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ExercisePagination({
  pagination,
  onPageChange,
}: {
  pagination: Pagination
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation(['exerciseLibrary', 'common'])
  if (pagination.totalPages <= 1) return null
  return (
    <nav
      aria-label={t('exerciseLibrary:pagination.label')}
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
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t('common:pagination.previousPage')}
      </button>
      <p className="text-sm text-zinc-400">
        {t('common:states.pageOf', {
          page: pagination.page,
          totalPages: pagination.totalPages,
        })}
      </p>
      <button
        type="button"
        disabled={!pagination.hasNextPage}
        onClick={() => {
          onPageChange(pagination.page + 1)
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 font-semibold disabled:opacity-35"
      >
        {t('common:pagination.nextPage')}
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
      </button>
    </nav>
  )
}
