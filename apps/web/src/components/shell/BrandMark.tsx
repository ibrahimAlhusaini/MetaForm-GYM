interface BrandMarkProps {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  const { t } = useTranslation('navigation')
  return (
    <div className="flex items-center gap-3" aria-label="MetaForm GYM">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime-300 font-black text-zinc-950 shadow-[0_0_24px_rgba(217,249,75,0.12)]">
        M
      </span>
      {compact ? null : (
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-100">
            METAFORM GYM
          </p>
          <p className="mt-1 text-[0.68rem] text-zinc-600">
            {t('shell.fitnessAnalytics')}
          </p>
        </div>
      )}
    </div>
  )
}
import { useTranslation } from 'react-i18next'
