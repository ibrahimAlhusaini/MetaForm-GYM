import type { WorkoutPlanSummary } from '@metaform/shared-types'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalDialog } from '../hooks/useModalDialog.js'

export function ClonePlanDialog({
  plan,
  pending,
  onClose,
  onConfirm,
}: {
  plan: WorkoutPlanSummary | null
  pending: boolean
  onClose: () => void
  onConfirm: (name: string) => void
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const [name, setName] = useState('')
  const dialogRef = useModalDialog(Boolean(plan))
  if (!plan) return null
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="clone-plan-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-[#151719] p-0 text-zinc-100 backdrop:bg-black/75"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm(name)
        }}
        className="p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="clone-plan-title" className="text-xl font-semibold">
              {t('workoutPlans:clone.title')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {t('workoutPlans:clone.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label={t('common:actions.close')}
            className="rounded-lg p-2"
          >
            <X className="size-5" />
          </button>
        </div>
        <label className="mt-5 block text-sm font-medium">
          {t('workoutPlans:clone.name')}
          <input
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value)
            }}
            placeholder={t('workoutPlans:clone.placeholder')}
            maxLength={120}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
          />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-11 rounded-xl border border-white/10 px-4"
          >
            {t('common:actions.cancel')}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-xl bg-lime-300 px-4 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t(
              pending
                ? 'workoutPlans:clone.cloning'
                : 'workoutPlans:clone.confirm',
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}
