import { createRef } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { LanguageSwitcher } from '../src/components/LanguageSwitcher.js'
import { MobileNavigation } from '../src/components/shell/MobileNavigation.js'
import { TopBar } from '../src/components/shell/TopBar.js'
import { DashboardHeader } from '../src/features/dashboard/components/DashboardHeader.js'
import { ExerciseVideo } from '../src/features/exercise-library/components/ExerciseVideo.js'
import { NutritionResults } from '../src/features/nutrition/components/NutritionResults.js'
import { ConfirmationDialog } from '../src/features/weight-tracker/components/ConfirmationDialog.js'
import { ExerciseSourceSelector } from '../src/features/weight-tracker/components/ExerciseSourceSelector.js'
import { PaginationControls } from '../src/features/weight-tracker/components/PaginationControls.js'
import { appPaths } from '../src/config/navigation.config.js'
import {
  changeAppLanguage,
  LANGUAGE_STORAGE_KEY,
  resolveAppLanguage,
  restoreSavedLanguage,
  translationResources,
} from '../src/i18n/index.js'
import { createLoginFormSchema } from '../src/validation/auth.schemas.js'
import i18n from '../src/i18n/index.js'
import { LoginPage } from '../src/pages/LoginPage.js'
import { RegisterPage } from '../src/pages/RegisterPage.js'
import { useAuthStore } from '../src/store/auth.store.js'

const leafPaths = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

beforeEach(() => {
  window.localStorage.clear()
  useAuthStore.setState({
    isAuthenticated: false,
    isInitializing: false,
    isSubmitting: false,
    accessToken: null,
    user: null,
    error: null,
  })
})

describe('internationalization core', () => {
  it('uses deterministic English fallback and rejects unsupported preferences', () => {
    expect(resolveAppLanguage(null)).toBe('en')
    expect(resolveAppLanguage('fr')).toBe('en')
    expect(resolveAppLanguage('ar')).toBe('ar')
  })

  it('restores Arabic, persists switches, and updates document language and direction', async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ar')
    await act(() => restoreSavedLanguage())
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')

    await act(() => changeAppLanguage('en'))
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
  })

  it('keeps Arabic resources complete for every current English key', () => {
    const arabicPaths = new Set(leafPaths(translationResources.ar))
    expect(
      leafPaths(translationResources.en).filter(
        (path) => !arabicPaths.has(path),
      ),
    ).toEqual([])
  })

  it('stores only the language preference when localization changes', async () => {
    await act(() => changeAppLanguage('ar'))
    expect(Object.keys(window.localStorage)).toEqual([LANGUAGE_STORAGE_KEY])
    expect(window.localStorage.getItem('accessToken')).toBeNull()
  })
})

describe('language switcher and shell', () => {
  it('is keyboard accessible and identifies the active language', async () => {
    const actor = userEvent.setup()
    render(<LanguageSwitcher />)
    const switcher = screen.getByRole('combobox', { name: 'Language' })
    expect(switcher).toHaveValue('en')
    await actor.selectOptions(switcher, 'ar')
    expect(await screen.findByRole('combobox', { name: 'اللغة' })).toHaveValue(
      'ar',
    )
  })

  it('renders one shared switcher in the authenticated top bar with Arabic navigation title', async () => {
    await act(() => changeAppLanguage('ar'))
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'member@example.com',
        role: 'USER',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        profile: null,
      },
    })
    render(
      <MemoryRouter initialEntries={[appPaths.weights]}>
        <TopBar
          menuButtonRef={createRef<HTMLButtonElement>()}
          onOpenMenu={() => undefined}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('combobox', { name: 'اللغة' })).toBeVisible()
    expect(screen.getByText('تتبع الأوزان')).toBeVisible()
  })

  it('keeps the RTL mobile drawer and navigation operable', async () => {
    await act(() => changeAppLanguage('ar'))
    render(
      <MemoryRouter>
        <MobileNavigation isOpen onClose={() => undefined} />
      </MemoryRouter>,
    )
    const drawer = screen.getByRole('dialog', { name: 'قائمة التطبيق' })
    expect(
      within(drawer).getByRole('link', { name: 'مكتبة التمارين' }),
    ).toHaveAttribute('href', appPaths.exercises)
    expect(
      within(drawer).getByRole('button', { name: 'إغلاق قائمة التطبيق' }),
    ).toBeEnabled()
  })
})

describe('localized current features', () => {
  it('renders the shared switcher and Arabic labels on login and register', async () => {
    await act(() => changeAppLanguage('ar'))
    const login = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'مرحبًا بعودتك' })).toBeVisible()
    expect(screen.getByLabelText('البريد الإلكتروني')).toHaveAttribute(
      'dir',
      'ltr',
    )
    expect(screen.getByRole('combobox', { name: 'اللغة' })).toBeVisible()
    login.unmount()
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'ابدأ من أساس أقوى' }),
    ).toBeVisible()
    expect(screen.getByLabelText('الاسم الكامل')).toBeVisible()
  })

  it('localizes auth validation without duplicating schemas', async () => {
    await act(() => changeAppLanguage('ar'))
    const result = createLoginFormSchema(
      i18n.getFixedT(null, 'auth'),
    ).safeParse({ email: 'bad', password: '' })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'أدخل بريدًا إلكترونيًا صالحًا',
      )
  })

  it('localizes Dashboard, Exercise Library, Nutrition, and Weight Tracker states', async () => {
    await act(() => changeAppLanguage('ar'))
    render(
      <MemoryRouter>
        <DashboardHeader
          firstName="سارة"
          generatedAt="2026-01-01T12:00:00.000Z"
        />
        <ExerciseVideo name="Squat" videoUrl={null} thumbnailUrl={null} />
        <NutritionResults result={null} />
        <ExerciseSourceSelector
          entry={{
            sourceType: 'machine',
            exerciseId: '',
            customMachineId: '',
            notes: '',
            sets: [],
          }}
          machines={[]}
          onChange={() => undefined}
        />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'مرحبًا بعودتك، سارة' }),
    ).toBeVisible()
    expect(screen.getByText('الفيديو غير متاح')).toBeVisible()
    expect(screen.getByText('ستظهر نتيجتك هنا')).toBeVisible()
    expect(screen.getByRole('radio', { name: 'مكتبة التمارين' })).toBeVisible()
  })

  it('keeps dialogs and pagination functional in Arabic', async () => {
    await act(() => changeAppLanguage('ar'))
    const actor = userEvent.setup()
    let confirmed = false
    const { rerender } = render(
      <ConfirmationDialog
        open
        title="تأكيد"
        description="وصف"
        confirmLabel="متابعة"
        onConfirm={() => {
          confirmed = true
        }}
        onClose={() => undefined}
      />,
    )
    await actor.click(screen.getByRole('button', { name: 'متابعة' }))
    expect(confirmed).toBe(true)
    rerender(
      <PaginationControls
        pagination={{
          page: 2,
          limit: 20,
          totalItems: 50,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        }}
        onPageChange={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: 'السابق' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'التالي' })).toBeEnabled()
  })
})
