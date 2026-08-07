import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { EntryDraft, Machine } from '../types/weight-tracker.types.js'
import { emptySetDraft } from '../utils/payload-transformers.js'
import { SetEditor } from './SetEditor.js'
import { ExerciseSourceSelector } from './ExerciseSourceSelector.js'

const move = <T,>(items: T[], from: number, to: number): T[] => {
  const next = [...items]
  const [item] = next.splice(from, 1)
  if (item !== undefined) next.splice(to, 0, item)
  return next
}
export function ExerciseEntryEditor({
  entry,
  index,
  total,
  machines,
  errors,
  onChange,
  onMove,
  onRemove,
}: {
  entry: EntryDraft
  index: number
  total: number
  machines: Machine[]
  errors?: string[]
  onChange: (entry: EntryDraft) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  const { t } = useTranslation('weightTracker')
  const updateSet = (setIndex: number, set: EntryDraft['sets'][number]) => {
    onChange({
      ...entry,
      sets: entry.sets.map((candidate, i) =>
        i === setIndex ? set : candidate,
      ),
    })
  }
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-[#111315] p-4 sm:p-6">
      <legend className="px-2 text-lg font-semibold">
        {t('entry.title', { number: index + 1 })}
      </legend>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <ExerciseSourceSelector
          entry={entry}
          machines={machines}
          onChange={onChange}
        />
        <div className="flex items-end gap-2">
          <button
            type="button"
            aria-label={t('entry.moveUp', { number: index + 1 })}
            disabled={index === 0}
            onClick={() => {
              onMove(-1)
            }}
            className="rounded-lg border border-white/10 p-3 disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t('entry.moveDown', { number: index + 1 })}
            disabled={index === total - 1}
            onClick={() => {
              onMove(1)
            }}
            className="rounded-lg border border-white/10 p-3 disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t('entry.delete', { number: index + 1 })}
            onClick={onRemove}
            className="rounded-lg border border-red-400/20 p-3 text-red-300"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {entry.planGuidance ? (
        <p className="mt-4 rounded-xl border border-lime-300/15 bg-lime-300/5 p-3 text-sm leading-6 text-zinc-300">
          {entry.planGuidance}
        </p>
      ) : null}
      <label className="mt-4 block text-sm font-medium">
        {t('entry.notes')}{' '}
        <span className="text-zinc-500">{t('entry.optional')}</span>
        <input
          value={entry.notes}
          onChange={(e) => {
            onChange({ ...entry, notes: e.target.value })
          }}
          className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
        />
      </label>
      <div className="mt-5 space-y-3">
        {entry.sets.map((set, setIndex) => (
          <SetEditor
            key={`${String(setIndex)}-${String(set.setNumber)}`}
            set={set}
            index={setIndex}
            total={entry.sets.length}
            error={errors?.[setIndex]}
            onChange={(value) => {
              updateSet(setIndex, value)
            }}
            onMove={(direction) => {
              onChange({
                ...entry,
                sets: move(entry.sets, setIndex, setIndex + direction),
              })
            }}
            onRemove={() => {
              onChange({
                ...entry,
                sets: entry.sets.filter((_, i) => i !== setIndex),
              })
            }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onChange({
            ...entry,
            sets: [...entry.sets, emptySetDraft(entry.sets.length + 1)],
          })
        }}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-lime-300/20 px-3 text-sm font-semibold text-lime-300"
      >
        <Plus className="size-4" />
        {t('set.add')}
      </button>
    </fieldset>
  )
}
