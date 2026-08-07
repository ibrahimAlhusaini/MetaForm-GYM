import type { WorkoutPlanSummary } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import { useModalDialog } from '../hooks/useModalDialog.js'

export function DeletePlanDialog({
  plan,
  pending,
  onClose,
  onConfirm,
}: {
  plan: WorkoutPlanSummary | null
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const dialogRef = useModalDialog(Boolean(plan))
  if (!plan) return null
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-plan-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-[#151719] p-0 text-zinc-100 backdrop:bg-black/75"
    >
      <div className="p-6">
        <h2 id="delete-plan-title" className="text-xl font-semibold">
          {t('workoutPlans:delete.title')}
        </h2>
        <p className="mt-3 leading-7 text-zinc-400">
          {t('workoutPlans:delete.description')}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={pending}
            className="min-h-11 rounded-xl border border-white/10 px-4"
          >
            {t('common:actions.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="min-h-11 rounded-xl bg-red-300 px-4 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t(
              pending
                ? 'workoutPlans:delete.deleting'
                : 'workoutPlans:delete.confirm',
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}
