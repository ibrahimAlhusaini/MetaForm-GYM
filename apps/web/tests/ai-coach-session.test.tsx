import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiCoachSessionPage } from '../src/features/ai-coach/pages/AiCoachSessionPage.js'
import { fetchAiCoachSession } from '../src/features/ai-coach/services/ai-coach.service.js'
import { aiCoachSession } from './fixtures/ai-coach.fixture.js'

vi.mock('../src/features/ai-coach/services/ai-coach.service.js', () => ({
  fetchAiCoachSession: vi.fn(),
}))
const renderPage = () =>
  render(
    <MemoryRouter
      initialEntries={[`/app/ai-coach/sessions/${aiCoachSession.id}`]}
    >
      <Routes>
        <Route
          path="/app/ai-coach/sessions/:sessionId"
          element={<AiCoachSessionPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchAiCoachSession).mockResolvedValue(aiCoachSession)
})

describe('AI Coach historical session detail', () => {
  it('loads a session and reuses the structured result presentation', async () => {
    renderPage()
    if (!aiCoachSession.result) throw new Error('Fixture result is required')
    expect(
      screen.getByText('Loading coaching session').closest('[role]'),
    ).toHaveAttribute('role', 'status')
    expect(
      await screen.findByRole('heading', {
        name: aiCoachSession.result.headline,
      }),
    ).toBeVisible()
    expect(screen.getByText('Findings')).toBeVisible()
    expect(screen.getByText('future_metric_key')).toBeVisible()
    const recommendations = screen.getAllByText(
      /Continue consistently|Protect recovery/,
    )
    expect(recommendations[0]).toHaveTextContent('Continue consistently')
  })

  it('shows a safe retryable detail error without raw API content', async () => {
    vi.mocked(fetchAiCoachSession).mockRejectedValue(
      new Error('Prisma P2025 raw detail'),
    )
    renderPage()
    expect(
      await screen.findByText(
        'This coaching session could not be found or loaded.',
      ),
    ).toBeVisible()
    expect(screen.queryByText(/Prisma P2025/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
  })
})
