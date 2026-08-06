import { useState } from 'react'
import type {
  ExerciseSet,
  SetDraft,
  SetInput,
} from '../types/weight-tracker.types.js'
import { emptySetDraft, setPayload } from '../utils/payload-transformers.js'
import { setDraftSchema } from '../validation/weight-tracker.schemas.js'
import { SetEditor } from './SetEditor.js'

const fromSet = (set: ExerciseSet): SetDraft => ({
  setNumber: set.setNumber,
  weightKg: set.weightKg?.toString() ?? '',
  reps: set.reps?.toString() ?? '',
  durationSeconds: set.durationSeconds?.toString() ?? '',
  distanceMeters: set.distanceMeters?.toString() ?? '',
  isWarmup: set.isWarmup,
})
export function SetMutationForm({
  set,
  nextNumber,
  pending,
  onSave,
  onCancel,
}: {
  set?: ExerciseSet
  nextNumber: number
  pending: boolean
  onSave: (input: SetInput) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(() =>
    set ? fromSet(set) : emptySetDraft(nextNumber),
  )
  const [error, setError] = useState<string | null>(null)
  const submit = async () => {
    const result = setDraftSchema.safeParse(draft)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check this set')
      return
    }
    setError(null)
    await onSave(setPayload(draft, draft.setNumber))
  }
  return (
    <div className="rounded-xl border border-lime-300/20 p-3">
      <SetEditor
        set={draft}
        index={draft.setNumber - 1}
        total={draft.setNumber}
        error={error ?? undefined}
        onChange={setDraft}
        onMove={() => undefined}
        onRemove={onCancel}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-lg border border-white/10 px-3"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void submit()}
          className="min-h-10 rounded-lg bg-lime-300 px-4 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save set'}
        </button>
      </div>
    </div>
  )
}
