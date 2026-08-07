import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CaloriesCalculatorPage } from '../src/features/nutrition/pages/CaloriesCalculatorPage.js'
import * as service from '../src/features/nutrition/services/nutrition.service.js'
import {
  completeNutritionProfile,
  incompleteNutritionProfile,
  nutritionCalculation,
  nutritionHistoryItem,
  nutritionPagination,
} from './fixtures/nutrition.fixture.js'

vi.mock('../src/features/nutrition/services/nutrition.service.js', () => ({
  calculateNutrition: vi.fn(),
  fetchLatestNutrition: vi.fn(),
  fetchNutritionHistory: vi.fn(),
  fetchNutritionProfileInputs: vi.fn(),
}))

const renderPage = () =>
  render(
    <MemoryRouter>
      <CaloriesCalculatorPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(service.fetchNutritionProfileInputs).mockResolvedValue(
    completeNutritionProfile,
  )
  vi.mocked(service.calculateNutrition).mockResolvedValue(nutritionCalculation)
  vi.mocked(service.fetchLatestNutrition).mockResolvedValue(
    nutritionHistoryItem,
  )
  vi.mocked(service.fetchNutritionHistory).mockResolvedValue({
    items: [nutritionHistoryItem],
    pagination: nutritionPagination,
  })
})

describe('nutrition profile and form', () => {
  it('shows profile, latest, and history loading independently', () => {
    vi.mocked(service.fetchNutritionProfileInputs).mockReturnValue(
      new Promise(() => undefined),
    )
    vi.mocked(service.fetchLatestNutrition).mockReturnValue(
      new Promise(() => undefined),
    )
    vi.mocked(service.fetchNutritionHistory).mockReturnValue(
      new Promise(() => undefined),
    )
    renderPage()
    expect(
      screen.getByRole('status', { name: 'Loading profile inputs' }),
    ).toBeVisible()
    expect(
      screen.getByRole('status', { name: 'Loading latest calculation' }),
    ).toBeVisible()
    expect(
      screen.getByRole('status', { name: 'Loading calculation history' }),
    ).toBeVisible()
  })

  it('prefills a complete profile and identifies profile sources', async () => {
    renderPage()
    expect(await screen.findByLabelText(/Age/)).toHaveValue('30')
    expect(screen.getByLabelText(/Weight/)).toHaveValue('82.5')
    expect(screen.getAllByText('From profile')).toHaveLength(6)
    expect(screen.getByText('Profile inputs loaded')).toBeVisible()
  })

  it('shows a safe profile error and retries without blocking other sections', async () => {
    vi.mocked(service.fetchNutritionProfileInputs).mockRejectedValueOnce(
      new Error('private Axios response'),
    )
    renderPage()
    expect(
      await screen.findByText(
        'We could not load your calculator profile inputs. Please try again.',
      ),
    ).toBeVisible()
    expect(screen.queryByText('private Axios response')).not.toBeInTheDocument()
    expect(screen.getByText('Latest calculation')).toBeVisible()
    const profileRegion = screen.getByLabelText('Calculator inputs')
    await userEvent.click(
      within(profileRegion).getByRole('button', { name: 'Try again' }),
    )
    expect(await screen.findByText('Profile inputs loaded')).toBeVisible()
  })

  it('shows incomplete inputs and supports manual overrides without mutating profile data', async () => {
    const actor = userEvent.setup()
    const original = structuredClone(incompleteNutritionProfile)
    vi.mocked(service.fetchNutritionProfileInputs).mockResolvedValue(
      incompleteNutritionProfile,
    )
    renderPage()
    expect(
      await screen.findByText('Profile information is incomplete'),
    ).toBeVisible()
    expect(screen.getByText(/Missing: age, activityLevel/)).toBeVisible()
    await actor.type(screen.getByLabelText(/Age/), '31')
    await actor.selectOptions(screen.getByLabelText(/Activity level/), 'LIGHT')
    await actor.clear(screen.getByLabelText(/Weight/))
    await actor.type(screen.getByLabelText(/Weight/), '84')
    await actor.click(screen.getByRole('button', { name: 'Calculate targets' }))
    await waitFor(() => {
      expect(service.calculateNutrition).toHaveBeenCalledWith({
        age: 31,
        activityLevel: 'LIGHT',
        weightKg: 84,
      })
    })
    expect(incompleteNutritionProfile).toEqual(original)
  })

  it('explains PREFER_NOT_TO_SAY and allows a temporary calculator value', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.fetchNutritionProfileInputs).mockResolvedValue({
      ...completeNutritionProfile,
      gender: 'PREFER_NOT_TO_SAY',
    })
    renderPage()
    expect(
      await screen.findByText(/requires a temporary male or female input/),
    ).toBeVisible()
    await actor.selectOptions(screen.getByLabelText(/Gender/), 'FEMALE')
    await actor.click(screen.getByRole('button', { name: 'Calculate targets' }))
    await waitFor(() => {
      expect(service.calculateNutrition).toHaveBeenCalledWith({
        gender: 'FEMALE',
      })
    })
  })

  it.each([
    ['Age', '13', 'Age must be between 14 and 100'],
    ['Age', '101', 'Age must be between 14 and 100'],
    ['Height', '99', 'Height must be between 100 and 250'],
    ['Weight', '351', 'Weight must be between 30 and 350'],
  ])('validates %s value %s', async (label, value, message) => {
    const actor = userEvent.setup()
    renderPage()
    const field = await screen.findByLabelText(new RegExp(label))
    await actor.clear(field)
    await actor.type(field, value)
    await actor.click(screen.getByRole('button', { name: 'Calculate targets' }))
    expect(await screen.findByText(message)).toBeVisible()
    expect(service.calculateNutrition).not.toHaveBeenCalled()
  })

  it('requires every missing select and does not submit an invalid form', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.fetchNutritionProfileInputs).mockResolvedValue({
      ...completeNutritionProfile,
      gender: null,
      activityLevel: null,
      goal: null,
      completeness: {
        ...completeNutritionProfile.completeness,
        gender: false,
        activityLevel: false,
        goal: false,
      },
    })
    renderPage()
    await actor.click(
      await screen.findByRole('button', { name: 'Calculate targets' }),
    )
    expect(screen.getByText('Gender is required')).toBeVisible()
    expect(screen.getByText('Activity level is required')).toBeVisible()
    expect(screen.getByText('Fitness goal is required')).toBeVisible()
    expect(service.calculateNutrition).not.toHaveBeenCalled()
  })
})

describe('nutrition calculation', () => {
  it('submits once, renders API-owned metrics and refreshes latest and history', async () => {
    const actor = userEvent.setup()
    renderPage()
    const button = await screen.findByRole('button', {
      name: 'Calculate targets',
    })
    await actor.click(button)
    expect(await screen.findByText('Daily nutrition targets')).toBeVisible()
    expect(service.calculateNutrition).toHaveBeenCalledOnce()
    expect(service.calculateNutrition).toHaveBeenCalledWith({})
    expect(screen.getByText(/BMI 25/)).toBeVisible()
    expect(screen.getByText('Overweight range')).toBeVisible()
    expect(screen.getByText(/general screening estimate/)).toBeVisible()
    expect(screen.getByText('API estimate disclaimer.')).toBeVisible()
    expect(screen.getByText(/safety calorie floor was applied/)).toBeVisible()
    expect(
      screen.getByText(/macro fallback strategy was applied/),
    ).toBeVisible()
    await waitFor(() => {
      expect(service.fetchLatestNutrition).toHaveBeenCalledTimes(2)
    })
    expect(service.fetchNutritionHistory).toHaveBeenCalledTimes(2)
  })

  it('disables submission while pending and prevents duplicate requests', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.calculateNutrition).mockReturnValue(
      new Promise(() => undefined),
    )
    renderPage()
    const button = await screen.findByRole('button', {
      name: 'Calculate targets',
    })
    await actor.click(button)
    expect(
      screen.getByRole('button', { name: 'Calculating...' }),
    ).toBeDisabled()
    await actor.click(screen.getByRole('button', { name: 'Calculating...' }))
    expect(service.calculateNutrition).toHaveBeenCalledOnce()
  })

  it('preserves inputs and hides a raw calculation error', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.calculateNutrition).mockRejectedValue(
      new Error('Axios Prisma secret'),
    )
    renderPage()
    const weight = await screen.findByLabelText(/Weight/)
    await actor.clear(weight)
    await actor.type(weight, '90')
    await actor.click(screen.getByRole('button', { name: 'Calculate targets' }))
    expect(await screen.findByText(/We could not calculate/)).toBeVisible()
    expect(screen.queryByText(/Axios Prisma secret/)).not.toBeInTheDocument()
    expect(weight).toHaveValue('90')
  })
})

describe('latest calculation and history', () => {
  it('renders the compact latest calculation with locale-formatted API values', async () => {
    renderPage()
    expect(await screen.findByText('Latest calculation')).toBeVisible()
    expect(screen.getAllByText('Build muscle').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/3[.,]076 kcal\/day/).length).toBeGreaterThan(0)
  })

  it('renders latest empty state without fake values', async () => {
    vi.mocked(service.fetchLatestNutrition).mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText('No calculation yet')).toBeVisible()
  })

  it('renders bounded history, legacy rows, pagination, sorting, and date filters', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.fetchNutritionHistory).mockResolvedValue({
      items: [
        {
          ...nutritionHistoryItem,
          id: 'legacy',
          inputs: null,
          methodology: null,
        },
      ],
      pagination: {
        ...nutritionPagination,
        totalItems: 20,
        totalPages: 2,
        hasNextPage: true,
      },
    })
    renderPage()
    expect(
      await screen.findByText('Historical input context not available'),
    ).toBeVisible()
    expect(screen.getByText('Version not available')).toBeVisible()
    await actor.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => {
      expect(service.fetchNutritionHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      )
    })
    await actor.selectOptions(screen.getByLabelText('Sort order'), 'asc')
    await waitFor(() => {
      expect(service.fetchNutritionHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, sortOrder: 'asc' }),
      )
    })
    await actor.type(screen.getByLabelText('From date'), '2026-08-01')
    await actor.type(screen.getByLabelText('To date'), '2026-08-07')
    await actor.click(screen.getByRole('button', { name: 'Apply dates' }))
    await waitFor(() => {
      expect(service.fetchNutritionHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dateFrom: '2026-08-01T00:00:00.000Z',
          dateTo: '2026-08-07T23:59:59.999Z',
        }),
      )
    })
  })

  it('handles history empty and safe retryable failure', async () => {
    vi.mocked(service.fetchNutritionHistory).mockRejectedValueOnce(
      new Error('raw stack'),
    )
    renderPage()
    expect(
      await screen.findByText(
        'We could not load calculation history. Please try again.',
      ),
    ).toBeVisible()
    expect(screen.queryByText('raw stack')).not.toBeInTheDocument()
    const history = screen
      .getByRole('heading', { name: 'History unavailable' })
      .closest('section')
    if (!history) throw new Error('Expected history error section')
    await userEvent.click(
      within(history).getByRole('button', { name: 'Try again' }),
    )
    expect(
      await screen.findByText(/Historical input context|Calculation history/),
    ).toBeVisible()
  })
})
