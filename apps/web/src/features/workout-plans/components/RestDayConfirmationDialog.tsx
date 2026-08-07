import { useTranslation } from 'react-i18next'
import { useModalDialog } from '../hooks/useModalDialog.js'

export function RestDayConfirmationDialog({
  open,
  id,
  onClose,
  onConfirm,
}: {
  open: boolean
  id: string
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const dialogRef = useModalDialog(open)
  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-[#151719] p-6 text-zinc-100 backdrop:bg-black/75"
    >
      <h2 id={id} className="text-xl font-semibold">
        {t('workoutPlans:restConfirm.title')}
      </h2>
      <p className="mt-3 text-zinc-400">
        {t('workoutPlans:restConfirm.description')}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="min-h-11 rounded-xl border border-white/10 px-4"
        >
          {t('common:actions.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-11 rounded-xl bg-red-200 px-4 font-semibold text-zinc-950"
        >
          {t('workoutPlans:restConfirm.confirm')}
        </button>
      </div>
    </dialog>
  )
}
