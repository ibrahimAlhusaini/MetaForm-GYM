import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SourceHistoryPage } from '../src/features/weight-tracker/pages/SourceHistoryPage.js'
import {
  fetchSourceHistory,
  fetchStrengthPrediction,
} from '../src/features/weight-tracker/services/weight-tracker.service.js'
import { history, machine } from './fixtures/weight-tracker.fixture.js'

vi.mock(
  '../src/features/weight-tracker/services/weight-tracker.service.js',
  () => ({ fetchSourceHistory: vi.fn(), fetchStrengthPrediction: vi.fn() }),
)
const renderHistory = (sourceType = 'machine', sourceId = machine.id) =>
  render(
    <MemoryRouter
      initialEntries={[`/app/weights/history/${sourceType}/${sourceId}`]}
    >
      <Routes>
        <Route
          path="/app/weights/history/:sourceType/:sourceId"
          element={<SourceHistoryPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
beforeEach(() => {
  vi.mocked(fetchSourceHistory).mockResolvedValue(history)
  vi.mocked(fetchStrengthPrediction).mockResolvedValue({
    status: 'AVAILABLE',
    previewStatus: 'RESEARCH_PREVIEW',
    method: 'LAST_SESSION',
    methodVersion: 'strength-next-session-v1',
    sourceType: 'CUSTOM_MACHINE',
    estimatedNextMaxWeightKg: 60,
    currentMaxWeightKg: 60,
    expectedChangeKg: 0,
    history: { completedSourceSessions: 5, recentCadenceDays: 6 },
    reliability: { reasonCodes: [] },
    disclaimerCode: 'EXPERIMENTAL_STRENGTH_ESTIMATE',
  })
})

describe('source history', () => {
  it('renders API-provided statistics and chart', async () => {
    renderHistory()
    expect((await screen.findAllByText('60 kg')).length).toBeGreaterThan(0)
    expect(screen.getByText('52.5 kg')).toBeVisible()
    expect(screen.getByTestId('responsive-chart')).toBeVisible()
    expect(screen.getByText(/has 1 strength point/)).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Next Session Strength Estimate' }),
    ).toBeVisible()
    expect(screen.getByText('Research Preview')).toBeVisible()
  })
  it('renders an empty history state', async () => {
    vi.mocked(fetchSourceHistory).mockResolvedValue({
      ...history,
      totalSessions: 0,
      totalSets: 0,
      chartPoints: [],
      sessions: { ...history.sessions, items: [] },
    })
    renderHistory()
    expect(
      await screen.findByRole('heading', {
        name: 'No completed strength history',
      }),
    ).toBeVisible()
  })
  it('shows missing previous values without inventing zero', async () => {
    vi.mocked(fetchSourceHistory).mockResolvedValue({
      ...history,
      previousRepresentativeWeightKg: null,
    })
    renderHistory()
    expect(
      (await screen.findAllByText('Not available')).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText('0 kg')).not.toBeInTheDocument()
  })
  it('uses an accessible image fallback', async () => {
    renderHistory()
    expect(
      await screen.findByRole('img', { name: 'Chest Press image unavailable' }),
    ).toBeVisible()
  })
  it('requests the next history page', async () => {
    vi.mocked(fetchSourceHistory).mockResolvedValue({
      ...history,
      sessions: {
        ...history.sessions,
        pagination: {
          ...history.sessions.pagination,
          totalPages: 2,
          hasNextPage: true,
        },
      },
    })
    const actor = userEvent.setup()
    renderHistory()
    await actor.click(await screen.findByRole('button', { name: 'Next' }))
    await waitFor(() => {
      expect(fetchSourceHistory).toHaveBeenLastCalledWith(
        'machine',
        machine.id,
        2,
      )
    })
  })
  it('keeps exercise and machine source routes distinct', async () => {
    vi.mocked(fetchSourceHistory).mockResolvedValue({
      ...history,
      source: { ...history.source, type: 'exercise' },
    })
    renderHistory('exercise', machine.id)
    await waitFor(() => {
      expect(fetchSourceHistory).toHaveBeenCalledWith('exercise', machine.id, 1)
    })
    expect(await screen.findByText('Exercise')).toBeVisible()
  })
  it('hides raw API errors', async () => {
    vi.mocked(fetchSourceHistory).mockImplementation(async () => {
      await Promise.resolve()
      throw new Error('Axios Prisma DATABASE_URL')
    })
    renderHistory()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load this strength history',
    )
    expect(
      screen.queryByText(/Axios|Prisma|DATABASE_URL/),
    ).not.toBeInTheDocument()
  })
})
