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
      'Exercise Videos',
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

  it('renders the correct nested page', () => {
    renderAt('/app/exercises')

    expect(
      screen.getByRole('heading', { name: 'Exercise Videos' }),
    ).toBeVisible()
    expect(
      screen.getByText(
        'The guided exercise library will be introduced in a future stage.',
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
      screen.getByRole('heading', { name: 'Calories Calculator' }),
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
    renderAt('/app/plans', false)

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    expect(screen.queryByLabelText('Desktop sidebar')).not.toBeInTheDocument()
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
