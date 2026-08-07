import { CheckCircle2, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { sessionStatus } from '../utils/formatters.js'

interface Props {
  completedAt: string | null
  onComplete: () => void
  onDelete: () => void
}

export function SessionDetailHeader({
  completedAt,
  onComplete,
  onDelete,
}: Props) {
  const { t } = useTranslation('weightTracker')
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link to="/app/weights/sessions" className="text-sm text-lime-300">
          {t('detail.back')}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">{t('detail.title')}</h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${completedAt ? 'bg-lime-300/10 text-lime-300' : 'bg-amber-300/10 text-amber-200'}`}
          >
            {sessionStatus(completedAt)}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {!completedAt ? (
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-4 font-semibold text-zinc-950"
          >
            <CheckCircle2 className="size-4" />
            {t('detail.complete')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-400/20 px-4 font-semibold text-red-300"
        >
          <Trash2 className="size-4" />
          {t('detail.delete')}
        </button>
      </div>
    </header>
  )
}
