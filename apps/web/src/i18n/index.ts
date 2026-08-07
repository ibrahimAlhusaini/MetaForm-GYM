import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { auth as enAuth } from './locales/en/auth.js'
import { common as enCommon } from './locales/en/common.js'
import { dashboard as enDashboard } from './locales/en/dashboard.js'
import { exerciseLibrary as enExerciseLibrary } from './locales/en/exerciseLibrary.js'
import { navigation as enNavigation } from './locales/en/navigation.js'
import { nutrition as enNutrition } from './locales/en/nutrition.js'
import { weightTracker as enWeightTracker } from './locales/en/weightTracker.js'
import { auth as arAuth } from './locales/ar/auth.js'
import { common as arCommon } from './locales/ar/common.js'
import { dashboard as arDashboard } from './locales/ar/dashboard.js'
import { exerciseLibrary as arExerciseLibrary } from './locales/ar/exerciseLibrary.js'
import { navigation as arNavigation } from './locales/ar/navigation.js'
import { nutrition as arNutrition } from './locales/ar/nutrition.js'
import { weightTracker as arWeightTracker } from './locales/ar/weightTracker.js'
import { isAppLanguage, languageDirection, type AppLanguage } from './locale.js'

export const LANGUAGE_STORAGE_KEY = 'metaform-language'

export const translationResources = {
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    dashboard: enDashboard,
    weightTracker: enWeightTracker,
    exerciseLibrary: enExerciseLibrary,
    nutrition: enNutrition,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    navigation: arNavigation,
    dashboard: arDashboard,
    weightTracker: arWeightTracker,
    exerciseLibrary: arExerciseLibrary,
    nutrition: arNutrition,
  },
}

export const resolveAppLanguage = (value: unknown): AppLanguage =>
  isAppLanguage(value) ? value : 'en'

const readSavedLanguage = (): AppLanguage => {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return resolveAppLanguage(saved)
  } catch {
    return 'en'
  }
}

const applyDocumentLanguage = (language: string): void => {
  const resolvedLanguage: AppLanguage = language.startsWith('ar') ? 'ar' : 'en'
  document.documentElement.lang = resolvedLanguage
  document.documentElement.dir = languageDirection(resolvedLanguage)
}

const persistLanguage = (language: string): void => {
  const resolvedLanguage: AppLanguage = language.startsWith('ar') ? 'ar' : 'en'
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolvedLanguage)
  } catch {
    // Language switching remains available when browser storage is blocked.
  }
}

const initialLanguage = readSavedLanguage()
applyDocumentLanguage(initialLanguage)

void i18n.use(initReactI18next).init({
  resources: translationResources,
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'ar'],
  defaultNS: 'common',
  fallbackNS: 'common',
  initAsync: false,
  returnNull: false,
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (language) => {
  applyDocumentLanguage(language)
  persistLanguage(language)
})

export const changeAppLanguage = async (
  language: AppLanguage,
): Promise<void> => {
  await i18n.changeLanguage(language)
}

export const restoreSavedLanguage = async (): Promise<void> => {
  await changeAppLanguage(readSavedLanguage())
}

export const resetI18nForTests = async (
  language: AppLanguage = 'en',
): Promise<void> => {
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  await i18n.changeLanguage(language)
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY)
}

export default i18n
