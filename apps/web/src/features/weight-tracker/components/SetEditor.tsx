import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SetDraft } from '../types/weight-tracker.types.js'

const fieldClass =
  'min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-sm outline-none focus:border-lime-300'
export function SetEditor({
  set,
  index,
  total,
  error,
  onChange,
  onMove,
  onRemove,
}: {
  set: SetDraft
  index: number
  total: number
  error?: string | undefined
  onChange: (set: SetDraft) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  const { t } = useTranslation('weightTracker')
  const update = (field: keyof SetDraft, value: string | boolean) => {
    onChange({ ...set, [field]: value })
  }
  return (
    <fieldset className="rounded-xl border border-white/8 bg-black/15 p-3">
      <legend className="px-1 text-sm font-semibold text-zinc-300">
        {t('set.title', { number: index + 1 })}
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-xs text-zinc-400">
          {t('set.weight')}
          <input
            aria-label={t('set.weightLabel', { number: index + 1 })}
            type="number"
            min="0"
            step="0.01"
            value={set.weightKg}
            onChange={(e) => {
              update('weightKg', e.target.value)
            }}
            className={fieldClass}
          />
        </label>
        <label className="text-xs text-zinc-400">
          {t('set.reps')}
          <input
            aria-label={t('set.repsLabel', { number: index + 1 })}
            type="number"
            min="0"
            step="1"
            value={set.reps}
            onChange={(e) => {
              update('reps', e.target.value)
            }}
            className={fieldClass}
          />
        </label>
        <label className="text-xs text-zinc-400">
          {t('set.duration')}
          <input
            aria-label={t('set.durationLabel', { number: index + 1 })}
            type="number"
            min="0"
            step="1"
            value={set.durationSeconds}
            onChange={(e) => {
              update('durationSeconds', e.target.value)
            }}
            className={fieldClass}
          />
        </label>
        <label className="text-xs text-zinc-400">
          {t('set.distance')}
          <input
            aria-label={t('set.distanceLabel', { number: index + 1 })}
            type="number"
            min="0"
            step="0.01"
            value={set.distanceMeters}
            onChange={(e) => {
              update('distanceMeters', e.target.value)
            }}
            className={fieldClass}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="me-auto inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={set.isWarmup}
            onChange={(e) => {
              update('isWarmup', e.target.checked)
            }}
            className="size-4 accent-lime-300"
          />
          {t('set.warmup')}
        </label>
        <button
          type="button"
          aria-label={t('set.moveUp', { number: index + 1 })}
          disabled={index === 0}
          onClick={() => {
            onMove(-1)
          }}
          className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label={t('set.moveDown', { number: index + 1 })}
          disabled={index === total - 1}
          onClick={() => {
            onMove(1)
          }}
          className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
        >
          <ArrowDown className="size-4" />
        </button>
        <button
          type="button"
          aria-label={t('set.delete', { number: index + 1 })}
          onClick={onRemove}
          className="rounded-lg border border-red-400/20 p-2 text-red-300"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </fieldset>
  )
}
