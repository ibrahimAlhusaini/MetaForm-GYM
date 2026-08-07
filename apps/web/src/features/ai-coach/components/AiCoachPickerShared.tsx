import { Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export function AiCoachPickerSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation('aiCoach')
  return (
    <label className="mt-4 block text-sm font-medium">
      {t('selection.search')}
      <span className="mt-2 flex rounded-xl border border-white/10 bg-[#151719] focus-within:border-lime-300">
        <Search
          className="ms-3 size-4 self-center text-zinc-500"
          aria-hidden="true"
        />
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          placeholder={t('selection.searchPlaceholder')}
          className="min-h-11 w-full bg-transparent px-3 outline-none"
        />
      </span>
    </label>
  )
}

export function AiCoachSelectedSource({
  label,
  onClear,
}: {
  label: string
  onClear: () => void
}) {
  const { t } = useTranslation('aiCoach')
  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-lime-300/30 bg-lime-300/5 px-3 py-2 text-sm">
      <span>{t('selection.selected', { name: label })}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={t('selection.clear')}
        className="rounded-lg p-2 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function AiCoachChoiceState({
  status,
  errorMessage,
  empty,
  onRetry,
  children,
}: {
  status: 'loading' | 'error' | 'success'
  errorMessage?: string
  empty: boolean
  onRetry: () => void
  children: ReactNode
}) {
  const { t } = useTranslation(['aiCoach', 'common'])
  return (
    <div
      className="mt-3 max-h-64 space-y-2 overflow-y-auto"
      aria-live="polite"
      aria-busy={status === 'loading'}
    >
      {status === 'loading' ? (
        <p role="status" className="p-3 text-sm text-zinc-400">
          {t('aiCoach:selection.loading')}
        </p>
      ) : null}
      {status === 'error' ? (
        <div role="alert" className="p-3 text-sm text-amber-100">
          {errorMessage}
          <button type="button" onClick={onRetry} className="ms-2 underline">
            {t('common:actions.retry')}
          </button>
        </div>
      ) : null}
      {status === 'success' && empty ? (
        <p className="p-3 text-sm text-zinc-400">
          {t('aiCoach:selection.noMatches')}
        </p>
      ) : (
        children
      )}
    </div>
  )
}
