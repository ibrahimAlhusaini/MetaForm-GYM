import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import type { WorkoutPlanPrefill } from '../hooks/useWorkoutPlanPrefill.js'
import { createBulkSession } from '../services/weight-tracker.service.js'
import type {
  EntryDraft,
  Machine,
  SessionDraft,
} from '../types/weight-tracker.types.js'
import { weightTrackerErrorMessage } from '../utils/error-message.js'
import { toDateTimeLocal } from '../utils/formatters.js'
import { emptySetDraft, sessionPayload } from '../utils/payload-transformers.js'
import { createSessionDraftSchema } from '../validation/weight-tracker.schemas.js'
import { ExerciseEntryEditor } from './ExerciseEntryEditor.js'

const emptyEntry = (): EntryDraft => ({
  sourceType: 'machine',
  exerciseId: '',
  customMachineId: '',
  notes: '',
  sets: [emptySetDraft()],
})

const move = <T,>(items: T[], from: number, to: number): T[] => {
  const next = [...items]
  const [item] = next.splice(from, 1)
  if (item !== undefined) next.splice(to, 0, item)
  return next
}

interface SessionBuilderFormProps {
  machines: Machine[]
  prefill: WorkoutPlanPrefill | null
}

export function SessionBuilderForm({
  machines,
  prefill,
}: SessionBuilderFormProps) {
  const { t } = useTranslation('weightTracker')
  const sessionDraftSchema = useMemo(() => createSessionDraftSchema(t), [t])
  const navigate = useNavigate()
  const [draft, setDraft] = useState<SessionDraft>(() => ({
    workoutPlanId: prefill?.workoutPlanId ?? null,
    startedAt: toDateTimeLocal(),
    notes: '',
    completeImmediately: false,
    entries: prefill?.entries ?? [],
  }))
  const [errors, setErrors] = useState<string[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const result = sessionDraftSchema.safeParse(draft)
    if (!result.success) {
      setErrors(result.error.issues.map((issue) => issue.message))
      return
    }
    setErrors([])
    setApiError(null)
    setSaving(true)
    try {
      const session = await createBulkSession(sessionPayload(draft))
      void navigate(`/app/weights/sessions/${session.id}`)
    } catch (reason) {
      setApiError(weightTrackerErrorMessage(reason, t('errors.saveWorkout')))
    } finally {
      setSaving(false)
    }
  }

  const updateEntry = (index: number, value: EntryDraft) => {
    setDraft((current) => ({
      ...current,
      entries: current.entries.map((entry, itemIndex) =>
        itemIndex === index ? value : entry,
      ),
    }))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="space-y-6"
    >
      <header>
        <Link to="/app/weights" className="text-sm text-lime-300">
          {t('builder.back')}
        </Link>
        <h1 className="mt-3 text-3xl font-semibold">{t('builder.title')}</h1>
        <p className="mt-2 text-zinc-400">{t('builder.description')}</p>
        {prefill ? (
          <p className="mt-4 rounded-xl border border-lime-300/15 bg-lime-300/5 p-4 text-sm text-zinc-300">
            {t('builder.planPrefill', {
              plan: prefill.planName,
              day: prefill.dayName,
            })}
          </p>
        ) : null}
      </header>
      <section className="grid gap-4 rounded-2xl border border-white/8 bg-[#111315] p-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          {t('builder.startTime')}
          <input
            type="datetime-local"
            value={draft.startedAt}
            onChange={(event) => {
              setDraft({ ...draft, startedAt: event.target.value })
            }}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
          />
        </label>
        <label className="text-sm font-medium">
          {t('builder.notes')}
          <input
            value={draft.notes}
            onChange={(event) => {
              setDraft({ ...draft, notes: event.target.value })
            }}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
          />
        </label>
        <label className="inline-flex items-center gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={draft.completeImmediately}
            onChange={(event) => {
              setDraft({ ...draft, completeImmediately: event.target.checked })
            }}
            className="size-4 accent-lime-300"
          />
          {t('builder.completeImmediately')}
        </label>
      </section>
      <div className="space-y-5">
        {draft.entries.map((entry, index) => (
          <ExerciseEntryEditor
            key={String(index)}
            entry={entry}
            index={index}
            total={draft.entries.length}
            machines={machines}
            onChange={(value) => {
              updateEntry(index, value)
            }}
            onMove={(direction) => {
              setDraft((current) => ({
                ...current,
                entries: move(current.entries, index, index + direction),
              }))
            }}
            onRemove={() => {
              setDraft((current) => ({
                ...current,
                entries: current.entries.filter(
                  (_, itemIndex) => itemIndex !== index,
                ),
              }))
            }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          setDraft((current) => ({
            ...current,
            entries: [...current.entries, emptyEntry()],
          }))
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-lime-300/20 px-4 font-semibold text-lime-300"
      >
        <Plus className="size-4" />
        {t('builder.addEntry')}
      </button>
      {errors.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"
        >
          <p className="font-semibold">{t('builder.review')}</p>
          <ul className="mt-2 list-disc ps-5">
            {[...new Set(errors)].map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {apiError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-red-200"
        >
          {apiError}
        </p>
      ) : null}
      <div className="sticky bottom-4 flex justify-end rounded-2xl border border-white/10 bg-[#111315]/95 p-4 backdrop-blur">
        <button
          type="submit"
          disabled={saving}
          className="min-h-12 rounded-xl bg-lime-300 px-7 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {saving
            ? t('builder.saving')
            : draft.completeImmediately
              ? t('builder.saveComplete')
              : t('builder.save')}
        </button>
      </div>
    </form>
  )
}
