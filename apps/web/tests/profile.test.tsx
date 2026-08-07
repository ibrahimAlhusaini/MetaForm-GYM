import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from '../src/features/profile/pages/ProfilePage.js'
import * as service from '../src/features/profile/services/profile.service.js'
import { changeAppLanguage, LANGUAGE_STORAGE_KEY } from '../src/i18n/index.js'
import {
  completeProfile,
  missingProfile,
  profileCompleteness,
  profileSummary,
} from './fixtures/profile.fixture.js'

vi.mock('../src/features/profile/services/profile.service.js', () => ({
  fetchProfile: vi.fn(),
  fetchProfileCompleteness: vi.fn(),
  fetchProfileSummary: vi.fn(),
  updateProfile: vi.fn(),
}))

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  vi.mocked(service.fetchProfile).mockResolvedValue(completeProfile)
  vi.mocked(service.fetchProfileCompleteness).mockResolvedValue(
    profileCompleteness,
  )
  vi.mocked(service.fetchProfileSummary).mockResolvedValue(profileSummary)
  vi.mocked(service.updateProfile).mockImplementation((payload) =>
    Promise.resolve({
      ...completeProfile,
      ...payload,
      initialized: true,
    }),
  )
})

describe('Profile loading and independent states', () => {
  it('shows the three loading regions independently', () => {
    vi.mocked(service.fetchProfile).mockReturnValue(
      new Promise(() => undefined),
    )
    vi.mocked(service.fetchProfileCompleteness).mockReturnValue(
      new Promise(() => undefined),
    )
    vi.mocked(service.fetchProfileSummary).mockReturnValue(
      new Promise(() => undefined),
    )
    renderPage()
    expect(
      screen.getByRole('status', { name: 'Loading profile' }),
    ).toBeVisible()
    expect(
      screen.getByRole('status', { name: 'Loading profile completeness' }),
    ).toBeVisible()
    expect(
      screen.getByRole('status', { name: 'Loading profile summary' }),
    ).toBeVisible()
  })

  it('retries a safe profile error', async () => {
    vi.mocked(service.fetchProfile).mockRejectedValueOnce(
      new Error('private Axios details'),
    )
    renderPage()
    expect(await screen.findByText(/could not load your profile/)).toBeVisible()
    expect(screen.queryByText(/private Axios/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByLabelText('Full name')).toHaveValue('Meta Member')
  })

  it('keeps the form usable when completeness and summary fail', async () => {
    vi.mocked(service.fetchProfileCompleteness).mockRejectedValue(
      new Error('raw'),
    )
    vi.mocked(service.fetchProfileSummary).mockRejectedValue(new Error('raw'))
    renderPage()
    expect(await screen.findByLabelText('Full name')).toBeEnabled()
    expect(screen.getByText('Completeness unavailable')).toBeVisible()
    expect(screen.getByText('Summary unavailable')).toBeVisible()
  })
})

describe('Profile display and missing legacy profiles', () => {
  it('prefills values and renders translated enums and server-owned context', async () => {
    renderPage()
    expect(await screen.findByLabelText('Full name')).toHaveValue('Meta Member')
    expect(screen.getByLabelText(/Birth date/)).toHaveValue('1998-08-07')
    expect(screen.getByLabelText(/^Gender$/)).toHaveValue('MALE')
    expect(screen.getAllByText('Build muscle').length).toBeGreaterThan(0)
    expect(screen.getByText('28 years old')).toBeVisible()
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
    expect(screen.getByRole('progressbar')).toHaveValue(100)
  })

  it('renders an editable missing-profile state and requires full name', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.fetchProfile).mockResolvedValue(missingProfile)
    renderPage()
    expect(await screen.findByText('Complete your profile')).toBeVisible()
    expect(screen.getByText(/personalize nutrition/)).toBeVisible()
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Full name is required')).toBeVisible()
    expect(service.updateProfile).not.toHaveBeenCalled()
    await actor.type(screen.getByLabelText(/^Full name/), 'Legacy Member')
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(service.updateProfile).toHaveBeenCalledWith({
        fullName: 'Legacy Member',
      })
    })
  })
})

describe('Profile editing and PATCH semantics', () => {
  it('submits only one dirty field and refreshes supporting panels', async () => {
    const actor = userEvent.setup()
    renderPage()
    const name = await screen.findByLabelText('Full name')
    await actor.clear(name)
    await actor.type(name, 'Changed Member')
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(service.updateProfile).toHaveBeenCalledWith({
        fullName: 'Changed Member',
      })
    })
    expect(service.fetchProfileCompleteness).toHaveBeenCalledTimes(2)
    expect(service.fetchProfileSummary).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Profile saved successfully.')).toBeVisible()
  })

  it('submits multiple dirty fields and sends null for an explicit clear', async () => {
    const actor = userEvent.setup()
    renderPage()
    const height = await screen.findByLabelText(/Height/)
    await actor.clear(height)
    await actor.selectOptions(screen.getByLabelText('Fitness goal'), 'LOSE_FAT')
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(service.updateProfile).toHaveBeenCalledWith({
        heightCm: null,
        fitnessGoal: 'LOSE_FAT',
      })
    })
  })

  it('discards locally and prevents a no-change save', async () => {
    const actor = userEvent.setup()
    renderPage()
    const name = await screen.findByLabelText('Full name')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    await actor.clear(name)
    await actor.type(name, 'Draft Name')
    await actor.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(name).toHaveValue('Meta Member')
    expect(service.fetchProfile).toHaveBeenCalledOnce()
    expect(service.updateProfile).not.toHaveBeenCalled()
  })

  it('prevents duplicate submits and preserves values after an API error', async () => {
    const actor = userEvent.setup()
    let rejectRequest: (() => void) | undefined
    vi.mocked(service.updateProfile).mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectRequest = () => {
            reject(new Error('Prisma secret'))
          }
        }),
    )
    renderPage()
    const name = await screen.findByLabelText('Full name')
    await actor.clear(name)
    await actor.type(name, 'Preserved Draft')
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(
      screen.getByRole('button', { name: 'Saving changes...' }),
    ).toBeDisabled()
    await actor.click(screen.getByRole('button', { name: 'Saving changes...' }))
    expect(service.updateProfile).toHaveBeenCalledOnce()
    rejectRequest?.()
    expect(await screen.findByText(/could not save your changes/)).toBeVisible()
    expect(screen.queryByText('Prisma secret')).not.toBeInTheDocument()
    expect(name).toHaveValue('Preserved Draft')
  })
})

describe('Profile validation, localization, accessibility, and privacy', () => {
  it.each([
    ['Full name', 'A', 'Full name must be between 2 and 100 characters'],
    ['Height', '99', 'Height must be between 100 and 250'],
    ['Current weight', '351', 'Current weight must be between 30 and 350'],
    [
      'Birth date',
      '2015-01-01',
      'Birth date must represent an age between 14 and 100',
    ],
  ])('validates %s', async (label, value, message) => {
    const actor = userEvent.setup()
    renderPage()
    const input = await screen.findByLabelText(new RegExp(label))
    await actor.clear(input)
    await actor.type(input, value)
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText(message)).toBeVisible()
    expect(service.updateProfile).not.toHaveBeenCalled()
  })

  it('explains snapshot behavior and never calls a BodyMeasurement service', async () => {
    renderPage()
    expect(
      await screen.findByText(/does not add a Weight Tracker history entry/),
    ).toBeVisible()
    expect(Object.keys(service)).toEqual(
      expect.arrayContaining([
        'fetchProfile',
        'fetchProfileCompleteness',
        'fetchProfileSummary',
        'updateProfile',
      ]),
    )
  })

  it('switches to professional Arabic, RTL, localized missing fields, and errors', async () => {
    await act(() => changeAppLanguage('ar'))
    vi.mocked(service.fetchProfileCompleteness).mockResolvedValue({
      ...profileCompleteness,
      percentage: 86,
      complete: false,
      missingFields: ['birthDate'],
    })
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'الملف الشخصي' }),
    ).toBeVisible()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('الاسم الكامل')).toBeVisible()
    expect(screen.getAllByText('تاريخ الميلاد')).toHaveLength(2)
    const name = screen.getByLabelText('الاسم الكامل')
    await userEvent.clear(name)
    await userEvent.click(screen.getByRole('button', { name: 'حفظ التغييرات' }))
    expect(await screen.findByText('الاسم الكامل مطلوب')).toBeVisible()
  })

  it('uses accessible progress and feedback without persisting profile data', async () => {
    const actor = userEvent.setup()
    renderPage()
    const progress = await screen.findByRole('progressbar')
    expect(progress).toHaveAccessibleName(/100% complete/)
    const name = screen.getByLabelText('Full name')
    await actor.clear(name)
    await actor.type(name, 'Private Member')
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Profile saved successfully.')).toBeVisible()
    expect(Object.keys(window.localStorage)).toEqual([])
    expect(window.localStorage.getItem('accessToken')).toBeNull()
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull()
  })
})
