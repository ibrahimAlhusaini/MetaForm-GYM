import type { NutritionHistoryResponse } from '@metaform/shared-types'
import { useState } from 'react'
import type { AsyncState } from '../../weight-tracker/hooks/useAsyncResource.js'
import type { NutritionDateFilters } from '../types/nutrition.types.js'
import {
  NutritionEmptyState,
  NutritionErrorState,
  NutritionSkeleton,
} from './NutritionStates.js'
import { NutritionHistoryItem } from './NutritionHistoryItem.js'

export function NutritionHistory({
  state,
  sortOrder,
  onSortChange,
  onApplyDates,
  onPageChange,
  onRetry,
}: {
  state: AsyncState<NutritionHistoryResponse['data']>
  sortOrder: 'asc' | 'desc'
  onSortChange: (order: 'asc' | 'desc') => void
  onApplyDates: (filters: NutritionDateFilters) => void
  onPageChange: (page: number) => void
  onRetry: () => void
}) {
  const [dates, setDates] = useState<NutritionDateFilters>({
    dateFrom: '',
    dateTo: '',
  })
  return (
    <section
      aria-labelledby="nutrition-history-title"
      className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="nutrition-history-title" className="text-xl font-semibold">
            Calculation history
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Review prior estimates without changing them.
          </p>
        </div>
        <label className="text-sm">
          Sort order
          <select
            value={sortOrder}
            onChange={(event) => {
              onSortChange(event.target.value === 'asc' ? 'asc' : 'desc')
            }}
            className="ml-2 min-h-10 rounded-lg border border-white/10 bg-black/30 px-3"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
      </div>
      <form
        className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault()
          onApplyDates(dates)
        }}
      >
        <DateField
          label="From date"
          value={dates.dateFrom}
          onChange={(dateFrom) => {
            setDates((current) => ({ ...current, dateFrom }))
          }}
        />
        <DateField
          label="To date"
          value={dates.dateTo}
          onChange={(dateTo) => {
            setDates((current) => ({ ...current, dateTo }))
          }}
        />
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-zinc-950 focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:outline-none"
        >
          Apply dates
        </button>
        <button
          type="button"
          onClick={() => {
            const cleared = { dateFrom: '', dateTo: '' }
            setDates(cleared)
            onApplyDates(cleared)
          }}
          className="min-h-11 rounded-xl border border-white/15 px-4 font-semibold focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:outline-none"
        >
          Clear
        </button>
      </form>
      <div className="mt-5" aria-live="polite">
        {state.status === 'loading' ? (
          <NutritionSkeleton label="Loading calculation history" />
        ) : null}
        {state.status === 'error' ? (
          <NutritionErrorState
            title="History unavailable"
            message={state.errorMessage}
            onRetry={onRetry}
          />
        ) : null}
        {state.status === 'success' && state.data.items.length === 0 ? (
          <NutritionEmptyState
            title="No calculations found"
            description="Try another date range, or complete your first nutrition calculation."
          />
        ) : null}
        {state.status === 'success' && state.data.items.length > 0 ? (
          <div className="space-y-3">
            {state.data.items.map((item) => (
              <NutritionHistoryItem key={item.id} item={item} />
            ))}
            <Pagination
              pagination={state.data.pagination}
              onPageChange={onPageChange}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:outline-none"
      />
    </label>
  )
}

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: NutritionHistoryResponse['data']['pagination']
  onPageChange: (page: number) => void
}) {
  return (
    <nav
      aria-label="Nutrition history pages"
      className="flex items-center justify-between gap-4 pt-2"
    >
      <button
        type="button"
        disabled={!pagination.hasPreviousPage}
        onClick={() => {
          onPageChange(pagination.page - 1)
        }}
        className="min-h-10 rounded-lg border border-white/15 px-4 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-zinc-400">
        Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
      </span>
      <button
        type="button"
        disabled={!pagination.hasNextPage}
        onClick={() => {
          onPageChange(pagination.page + 1)
        }}
        className="min-h-10 rounded-lg border border-white/15 px-4 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  )
}
