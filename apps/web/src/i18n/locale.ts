export const supportedLanguages = ['en', 'ar'] as const
export type AppLanguage = (typeof supportedLanguages)[number]

export const isAppLanguage = (value: unknown): value is AppLanguage =>
  typeof value === 'string' &&
  supportedLanguages.some((language) => language === value)

export const languageDirection = (language: AppLanguage): 'ltr' | 'rtl' =>
  language === 'ar' ? 'rtl' : 'ltr'

export const localeForLanguage = (language: string): 'en-US' | 'ar-SA' =>
  language.startsWith('ar') ? 'ar-SA' : 'en-US'

export const useAppLocale = (): 'en-US' | 'ar-SA' => {
  const { i18n } = useTranslation()
  return localeForLanguage(i18n.resolvedLanguage ?? i18n.language)
}
import { useTranslation } from 'react-i18next'
