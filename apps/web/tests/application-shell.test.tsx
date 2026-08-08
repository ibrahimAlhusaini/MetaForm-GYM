import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../src/routes/AppRoutes.js'
import { logoutRequest } from '../src/services/auth.service.js'
import {
  resetAuthStoreForTests,
  useAuthStore,
} from '../src/store/auth.store.js'
import { user } from './fixtures/auth.fixture.js'
import { populatedDashboardData } from './fixtures/dashboard.fixture.js'
import { fetchDashboardSummary } from '../src/features/dashboard/services/dashboard.service.js'
import {
  fetchMachines,
  fetchSessions,
} from '../src/features/weight-tracker/services/weight-tracker.service.js'
import {
  fetchExerciseFilterOptions,
  fetchExercises,
} from '../src/features/exercise-library/services/exercise-library.service.js'
import {
  exercise,
  exerciseFilterOptions,
  exercisePagination,
} from './fixtures/exercise-library.fixture.js'
import {
  completeNutritionProfile,
  nutritionHistoryItem,
  nutritionPagination,
} from './fixtures/nutrition.fixture.js'
import {
  fetchLatestNutrition,
  fetchNutritionHistory,
  fetchNutritionProfileInputs,
} from '../src/features/nutrition/services/nutrition.service.js'
import {
  fetchProfile,
  fetchProfileCompleteness,
  fetchProfileSummary,
} from '../src/features/profile/services/profile.service.js'
import {
  fetchAiCoachCapabilities,
  fetchAiCoachSessions,
} from '../src/features/ai-coach/services/ai-coach.service.js'
import { aiCoachCapabilities } from './fixtures/ai-coach.fixture.js'
import {
  completeProfile,
  profileCompleteness,
  profileSummary,
} from './fixtures/profile.fixture.js'

vi.mock('../src/services/auth.service.js', () => ({
  fetchCurrentUserRequest: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  refreshSessionRequest: vi.fn(),
  registerRequest: vi.fn(),
}))

vi.mock('../src/features/dashboard/services/dashboard.service.js', () => ({
  fetchDashboardSummary: vi.fn(),
}))
vi.mock(
  '../src/features/weight-tracker/services/weight-tracker.service.js',
  () => ({
    fetchMachines: vi.fn(),
    fetchSessions: vi.fn(),
  }),
)
vi.mock('../src/features/nutrition/services/nutrition.service.js', () => ({
  calculateNutrition: vi.fn(),
  fetchLatestNutrition: vi.fn(),
  fetchNutritionHistory: vi.fn(),
  fetchNutritionProfileInputs: vi.fn(),
}))
vi.mock('../src/features/profile/services/profile.service.js', () => ({
  fetchProfile: vi.fn(),
  fetchProfileCompleteness: vi.fn(),
  fetchProfileSummary: vi.fn(),
  updateProfile: vi.fn(),
}))
vi.mock('../src/features/ai-coach/services/ai-coach.service.js', () => ({
  createAiCoachSession: vi.fn(),
  fetchAiCoachCapabilities: vi.fn(),
  fetchAiCoachSession: vi.fn(),
  fetchAiCoachSessions: vi.fn(),
}))
vi.mock(
  '../src/features/exercise-library/services/exercise-library.service.js',
  () => ({
    fetchExercise: vi.fn(),
    fetchExerciseFilterOptions: vi.fn(),
    fetchExerciseOptions: vi.fn(),
    fetchExercises: vi.fn(),
  }),
)

const renderAt = (path: string, authenticated = true) => {
  useAuthStore.setState({
    accessToken: authenticated ? 'test-access-token' : null,
    isAuthenticated: authenticated,
    isInitializing: false,
    user: authenticated ? user : null,
  })

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetAuthStoreForTests()
  vi.clearAllMocks()
  vi.mocked(logoutRequest).mockResolvedValue(undefined)
  vi.mocked(fetchDashboardSummary).mockResolvedValue({
    ...populatedDashboardData,
    user: { firstName: 'Meta Member' },
  })
  const pagination = {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  }
  vi.mocked(fetchMachines).mockResolvedValue({ items: [], pagination })
  vi.mocked(fetchSessions).mockResolvedValue({ items: [], pagination })
  vi.mocked(fetchExerciseFilterOptions).mockResolvedValue(exerciseFilterOptions)
  vi.mocked(fetchExercises).mockResolvedValue({
    items: [exercise],
    pagination: exercisePagination,
  })
  vi.mocked(fetchNutritionProfileInputs).mockResolvedValue(
    completeNutritionProfile,
  )
  vi.mocked(fetchLatestNutrition).mockResolvedValue(nutritionHistoryItem)
  vi.mocked(fetchNutritionHistory).mockResolvedValue({
    items: [nutritionHistoryItem],
    pagination: nutritionPagination,
  })
  vi.mocked(fetchProfile).mockResolvedValue(completeProfile)
  vi.mocked(fetchProfileCompleteness).mockResolvedValue(profileCompleteness)
  vi.mocked(fetchProfileSummary).mockResolvedValue(profileSummary)
  vi.mocked(fetchAiCoachCapabilities).mockResolvedValue(aiCoachCapabilities)
  vi.mocked(fetchAiCoachSessions).mockResolvedValue({
    items: [],
    pagination: { ...pagination, limit: 10 },
  })
})

describe('authenticated application shell', () => {
  it('renders the shared authenticated layout', () => {
    renderAt('/app')

    expect(screen.getByLabelText('Desktop sidebar')).toBeInTheDocument()
    expect(screen.getByLabelText('Application toolbar')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('renders every application navigation link', () => {
    renderAt('/app')

    const navigation = screen.getByLabelText('Application navigation')
    for (const label of [
      'Home',
      'Weight Tracker',
      'Exercise Library',
      'AI Coach',
      'Calories',
      'Workout Plans',
      'Profile',
    ]) {
      expect(
        within(navigation).getByRole('link', { name: label }),
      ).toBeVisible()
    }
  })

  it('marks the current navigation item', () => {
    renderAt('/app/weights')

    expect(
      screen.getByRole('link', { name: 'Weight Tracker' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('renders the correct nested page', async () => {
    renderAt('/app/exercises')

    expect(
      await screen.findByRole('heading', { name: 'Exercise Library' }),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Explore published exercises, refine by training focus, and open clear movement guidance.',
      ),
    ).toBeVisible()
  })

  it('opens and closes the mobile drawer with Escape', async () => {
    const actor = userEvent.setup()
    renderAt('/app')
    const menuButton = screen.getByRole('button', {
      name: 'Open application menu',
    })

    await actor.click(menuButton)
    expect(
      screen.getByRole('dialog', { name: 'Application menu' }),
    ).toBeVisible()
    expect(document.body).toHaveStyle({ overflow: 'hidden' })

    await actor.keyboard('{Escape}')
    expect(
      screen.queryByRole('dialog', { name: 'Application menu' }),
    ).not.toBeInTheDocument()
    await waitFor(() => {
      expect(menuButton).toHaveFocus()
    })
  })

  it('closes the mobile drawer when navigation changes', async () => {
    const actor = userEvent.setup()
    renderAt('/app')
    await actor.click(
      screen.getByRole('button', { name: 'Open application menu' }),
    )
    const drawer = screen.getByRole('dialog', { name: 'Application menu' })

    await actor.click(within(drawer).getByRole('link', { name: 'Calories' }))

    expect(drawer).not.toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        name: 'Calories & Macronutrient Calculator',
      }),
    ).toBeVisible()
  })

  it('keeps logout connected to the existing authentication store', async () => {
    const actor = userEvent.setup()
    renderAt('/app')

    await actor.click(screen.getByRole('button', { name: 'Log out' }))

    expect(logoutRequest).toHaveBeenCalledOnce()
    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeVisible()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('still redirects unauthenticated application access to login', () => {
    renderAt('/app/calories', false)

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    expect(screen.queryByLabelText('Desktop sidebar')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated AI Coach access to login', () => {
    renderAt('/app/ai-coach', false)
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    expect(
      screen.queryByText('What would you like help with?'),
    ).not.toBeInTheDocument()
  })

  it('provides a structural skip link to the main content', () => {
    renderAt('/app')

    expect(
      screen.getByRole('link', { name: 'Skip to main content' }),
    ).toHaveAttribute('href', '#main-content')
    expect(document.querySelector('#main-content')).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })

  it('renders the Weight Tracker workflow instead of its placeholder', async () => {
    renderAt('/app/weights')
    expect(
      await screen.findByRole('heading', { name: 'Weight Tracker' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Start workout' })).toBeVisible()
    expect(screen.queryByText('Coming in next stage')).not.toBeInTheDocument()
  })

  it('renders the Profile workflow instead of its placeholder', async () => {
    renderAt('/app/profile')
    expect(
      await screen.findByRole('heading', { name: 'Profile' }),
    ).toBeVisible()
    expect(await screen.findByLabelText('Full name')).toHaveValue('Meta Member')
    expect(screen.queryByText('Coming in next stage')).not.toBeInTheDocument()
  })

  it('renders the guided AI Coach workflow instead of its placeholder', async () => {
    renderAt('/app/ai-coach')
    expect(
      await screen.findByRole('heading', { name: 'AI Coach' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'What would you like help with?' }),
    ).toBeVisible()
    expect(screen.queryByText('Planned feature')).not.toBeInTheDocument()
  })

  it('renders an unknown authenticated route inside the shell', () => {
    renderAt('/app/not-a-route')

    expect(
      screen.getByRole('heading', {
        name: 'This application route does not exist.',
      }),
    ).toBeVisible()
    expect(screen.getByLabelText('Desktop sidebar')).toBeInTheDocument()
  })
})
