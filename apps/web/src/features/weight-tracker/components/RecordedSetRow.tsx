import { ArrowDown, ArrowUp, Award, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ExerciseSet } from '../types/weight-tracker.types.js'
import { formatKg } from '../utils/formatters.js'

interface Props {
  set: ExerciseSet
  index: number
  total: number
  pending: boolean
  onEdit: () => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
}

const metricText = (set: ExerciseSet): string =>
  [
    set.weightKg === null ? null : formatKg(set.weightKg),
    set.reps === null ? null : `${String(set.reps)} reps`,
    set.durationSeconds === null ? null : `${String(set.durationSeconds)} sec`,
    set.distanceMeters === null ? null : `${String(set.distanceMeters)} m`,
  ]
    .filter(Boolean)
    .join(' · ')

export function RecordedSetRow({
  set,
  index,
  total,
  pending,
  onEdit,
  onMove,
  onDelete,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/7 bg-black/15 px-3 py-3">
      <span className="grid size-8 place-items-center rounded-lg bg-white/5 text-sm font-semibold">
        {String(set.setNumber)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{metricText(set)}</p>
        <div className="mt-1 flex gap-2 text-xs">
          <span className={set.isWarmup ? 'text-amber-200' : 'text-zinc-500'}>
            {set.isWarmup ? 'Warmup' : 'Working set'}
          </span>
          {set.isPersonalRecord ? (
            <span className="inline-flex items-center gap-1 font-semibold text-lime-300">
              <Award className="size-3" /> Personal record
            </span>
          ) : null}
        </div>
      </div>
      <SetAction label={`Edit set ${String(set.setNumber)}`} onClick={onEdit}>
        <Pencil className="size-4" />
      </SetAction>
      <SetAction
        label={`Move set ${String(set.setNumber)} up`}
        disabled={index === 0 || pending}
        onClick={() => {
          onMove(-1)
        }}
      >
        <ArrowUp className="size-4" />
      </SetAction>
      <SetAction
        label={`Move set ${String(set.setNumber)} down`}
        disabled={index === total - 1 || pending}
        onClick={() => {
          onMove(1)
        }}
      >
        <ArrowDown className="size-4" />
      </SetAction>
      <SetAction
        label={`Delete set ${String(set.setNumber)}`}
        disabled={pending}
        onClick={onDelete}
        destructive
      >
        <Trash2 className="size-4" />
      </SetAction>
    </div>
  )
}

function SetAction({
  label,
  disabled,
  destructive,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  destructive?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg p-2 disabled:opacity-30 ${destructive ? 'text-red-300' : 'text-zinc-400'}`}
    >
      {children}
    </button>
  )
}
