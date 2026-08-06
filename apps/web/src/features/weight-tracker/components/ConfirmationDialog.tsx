import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  destructive = true,
  onConfirm,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])
  if (!open) return null
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirmation-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-[#151719] p-0 text-zinc-100 backdrop:bg-black/75"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="confirmation-title" className="text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close confirmation"
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-lime-300"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-3 leading-7 text-zinc-400">{description}</p>
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-11 rounded-xl border border-white/10 px-4 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`min-h-11 rounded-xl px-4 font-semibold text-zinc-950 ${destructive ? 'bg-red-300 hover:bg-red-200' : 'bg-lime-300 hover:bg-lime-200'}`}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
