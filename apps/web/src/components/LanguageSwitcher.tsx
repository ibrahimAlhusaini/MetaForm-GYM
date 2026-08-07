import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { changeAppLanguage } from '../i18n/index.js'
import { isAppLanguage } from '../i18n/locale.js'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common')
  const currentLanguage = i18n.resolvedLanguage?.startsWith('ar') ? 'ar' : 'en'

  return (
    <label className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-200 transition focus-within:border-lime-300 focus-within:ring-2 focus-within:ring-lime-300/15 hover:border-white/20">
      <Languages className="size-4 text-lime-300" aria-hidden="true" />
      <span className="sr-only">{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        value={currentLanguage}
        onChange={(event) => {
          if (isAppLanguage(event.target.value))
            void changeAppLanguage(event.target.value)
        }}
        className="cursor-pointer bg-transparent font-medium outline-none"
      >
        <option className="bg-zinc-900" value="en">
          {t('language.english')}
        </option>
        <option className="bg-zinc-900" value="ar">
          {t('language.arabic')}
        </option>
      </select>
    </label>
  )
}
