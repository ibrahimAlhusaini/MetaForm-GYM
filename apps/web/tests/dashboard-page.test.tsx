import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '../src/features/dashboard/DashboardPage.js'
import { fetchDashboardSummary } from '../src/features/dashboard/services/dashboard.service.js'
import {
  dashboardResponse,
  emptyDashboardData,
  populatedDashboardData,
} from './fixtures/dashboard.fixture.js'

vi.mock('../src/features/dashboard/services/dashboard.service.js', () => ({
  fetchDashboardSummary: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchDashboardSummary).mockResolvedValue(populatedDashboardData)
})

describe('dashboard page states and overview', () => {
  it('renders the dashboard loading skeleton', () => {
    vi.mocked(fetchDashboardSummary).mockReturnValue(Promise.race([]))
    render(<DashboardPage />)

    expect(screen.getByLabelText('Loading dashboard')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  it('renders a safe dashboard error state', async () => {
    vi.mocked(fetchDashboardSummary).mockRejectedValue(
      new Error('connect ECONNREFUSED with internal details'),
    )
    render(<DashboardPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your dashboard. Please try again.',
    )
  })

  it('retries after a dashboard request fails', async () => {
    vi.mocked(fetchDashboardSummary)
      .mockRejectedValueOnce(new Error('request failed'))
      .mockResolvedValueOnce(populatedDashboardData)
    const actor = userEvent.setup()
    render(<DashboardPage />)

    await actor.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'Welcome back, Amina' }),
    ).toBeVisible()
    expect(fetchDashboardSummary).toHaveBeenCalledTimes(2)
  })

  it('renders independent empty dashboard states', async () => {
    vi.mocked(fetchDashboardSummary).mockResolvedValue(emptyDashboardData)
    render(<DashboardPage />)

    expect(
      await screen.findByRole('heading', { name: 'Welcome back, Dashboard' }),
    ).toBeVisible()
    expect(screen.getAllByText('Not available')).toHaveLength(2)
    expect(screen.getByText('No data yet')).toBeVisible()
    expect(screen.getByText('No body-weight history yet')).toBeVisible()
    expect(screen.getByText('No strength history yet')).toBeVisible()
  })

  it('renders the current body-weight card', async () => {
    render(<DashboardPage />)

    expect(await screen.findByText('78.5 kg')).toBeVisible()
  })

  it('renders a profile fallback weight supplied by the API contract', async () => {
    vi.mocked(fetchDashboardSummary).mockResolvedValue({
      ...emptyDashboardData,
      overview: { ...emptyDashboardData.overview, currentBodyWeightKg: 81.25 },
    })
    render(<DashboardPage />)

    expect(await screen.findByText('81.25 kg')).toBeVisible()
  })

  it('renders unavailable daily calories without substituting zero', async () => {
    vi.mocked(fetchDashboardSummary).mockResolvedValue(emptyDashboardData)
    render(<DashboardPage />)

    expect(await screen.findByText('Daily maintenance')).toBeVisible()
    expect(screen.queryByText('0 kcal')).not.toBeInTheDocument()
  })

  it('renders the current workout streak', async () => {
    render(<DashboardPage />)

    expect(await screen.findByText('3 days')).toBeVisible()
  })

  it('renders completed workouts', async () => {
    render(<DashboardPage />)

    expect(await screen.findByText('12 workouts')).toBeVisible()
  })

  it('renders the last-workout duration', async () => {
    render(<DashboardPage />)

    expect(await screen.findByText('64 min')).toBeVisible()
  })

  it('renders normal weekly progress', async () => {
    render(<DashboardPage />)

    expect(await screen.findByText('+50% vs previous week')).toBeVisible()
    expect(screen.getByText('Previous week: 2 workouts')).toBeVisible()
  })

  it('renders null weekly percentage as new activity', async () => {
    vi.mocked(fetchDashboardSummary).mockResolvedValue({
      ...emptyDashboardData,
      overview: {
        ...emptyDashboardData.overview,
        weeklyProgress: {
          completedWorkouts: 2,
          previousWeekCompletedWorkouts: 0,
          percentageChange: null,
        },
      },
    })
    render(<DashboardPage />)

    expect(await screen.findByText('New activity')).toBeVisible()
  })

  it('never exposes a raw API error to the user', async () => {
    vi.mocked(fetchDashboardSummary).mockRejectedValue(
      new Error('Prisma P2024 DATABASE_URL=private'),
    )
    render(<DashboardPage />)

    await screen.findByRole('alert')
    expect(
      screen.queryByText(/Prisma|DATABASE_URL|P2024/),
    ).not.toBeInTheDocument()
  })

  it('consumes data typed by the shared dashboard contract', async () => {
    vi.mocked(fetchDashboardSummary).mockResolvedValue(dashboardResponse.data)
    render(<DashboardPage />)

    expect(
      await screen.findByRole('heading', { name: 'Welcome back, Amina' }),
    ).toBeVisible()
  })
})
