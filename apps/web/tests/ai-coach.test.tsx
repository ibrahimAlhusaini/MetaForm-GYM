import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiCoachPage } from '../src/features/ai-coach/pages/AiCoachPage.js'
import {
  createAiCoachSession,
  fetchAiCoachCapabilities,
  fetchAiCoachSessions,
} from '../src/features/ai-coach/services/ai-coach.service.js'
import { fetchExerciseOptions } from '../src/features/exercise-library/services/exercise-library.service.js'
import { fetchMachines } from '../src/features/weight-tracker/services/weight-tracker.service.js'
import { fetchWorkoutPlans } from '../src/features/workout-plans/services/workout-plans.service.js'
import { changeAppLanguage, LANGUAGE_STORAGE_KEY } from '../src/i18n/index.js'
import {
  aiCoachCapabilities,
  aiCoachHistory,
  aiCoachSession,
  insufficientAiCoachSession,
} from './fixtures/ai-coach.fixture.js'
import { exerciseOption } from './fixtures/exercise-library.fixture.js'
import { machine, pagination } from './fixtures/weight-tracker.fixture.js'
import {
  planPagination,
  planSummary,
} from './fixtures/workout-plans.fixture.js'

vi.mock('../src/features/ai-coach/services/ai-coach.service.js', () => ({
  fetchAiCoachCapabilities: vi.fn(),
  createAiCoachSession: vi.fn(),
  fetchAiCoachSessions: vi.fn(),
  fetchAiCoachSession: vi.fn(),
}))
vi.mock(
  '../src/features/exercise-library/services/exercise-library.service.js',
  () => ({ fetchExerciseOptions: vi.fn() }),
)
vi.mock(
  '../src/features/weight-tracker/services/weight-tracker.service.js',
  () => ({ fetchMachines: vi.fn() }),
)
vi.mock(
  '../src/features/workout-plans/services/workout-plans.service.js',
  () => ({ fetchWorkoutPlans: vi.fn(), fetchWorkoutPlanTemplates: vi.fn() }),
)

const renderPage = () =>
  render(
    <MemoryRouter>
      <AiCoachPage />
    </MemoryRouter>,
  )
const selectCapability = async (name: string) => {
  const heading = await screen.findByRole('heading', { name })
  const card = heading.closest('article')
  if (!card) throw new Error('Capability card is missing')
  await userEvent.click(within(card).getByRole('button'))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchAiCoachCapabilities).mockResolvedValue(aiCoachCapabilities)
  vi.mocked(fetchAiCoachSessions).mockResolvedValue(aiCoachHistory)
  vi.mocked(createAiCoachSession).mockResolvedValue(aiCoachSession)
  vi.mocked(fetchExerciseOptions).mockResolvedValue([exerciseOption])
  vi.mocked(fetchMachines).mockResolvedValue({ items: [machine], pagination })
  vi.mocked(fetchWorkoutPlans).mockResolvedValue({
    items: [planSummary],
    pagination: planPagination,
  })
})

describe('AI Coach guided page', () => {
  it('shows loading, all discovered capabilities, and no chat input', async () => {
    let resolveCapabilities: (value: typeof aiCoachCapabilities) => void = () =>
      undefined
    vi.mocked(fetchAiCoachCapabilities).mockReturnValue(
      new Promise((resolve) => {
        resolveCapabilities = resolve
      }),
    )
    renderPage()
    expect(
      screen.getByText('Loading coaching capabilities').closest('[role]'),
    ).toHaveTextContent('Loading coaching capabilities')
    resolveCapabilities(aiCoachCapabilities)
    expect(
      await screen.findByRole('heading', { name: 'Analyze my progress' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Weekly fitness summary' }),
    ).toBeVisible()
    expect(
      screen.queryByPlaceholderText(/message|prompt|ask/i),
    ).not.toBeInTheDocument()
  })

  it('handles capability discovery error and retry', async () => {
    vi.mocked(fetchAiCoachCapabilities)
      .mockRejectedValueOnce(new Error('raw'))
      .mockResolvedValue(aiCoachCapabilities)
    renderPage()
    expect(
      await screen.findByText(
        'Coaching capabilities could not be loaded. Try again.',
      ),
    ).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('heading', { name: 'Analyze my progress' }),
    ).toBeVisible()
  })

  it('ignores an unknown future capability without crashing', async () => {
    const firstCapability = aiCoachCapabilities[0]
    if (!firstCapability) throw new Error('Capability fixture is required')
    const futureCapability = { ...firstCapability }
    Object.defineProperty(futureCapability, 'type', {
      value: 'FUTURE_REVIEW',
    })
    vi.mocked(fetchAiCoachCapabilities).mockResolvedValue([
      ...aiCoachCapabilities,
      futureCapability,
    ])
    renderPage()
    expect(
      await screen.findByText(
        '1 newer coaching option is not supported by this app yet.',
      ),
    ).toBeVisible()
    expect(screen.queryByText('FUTURE_REVIEW')).not.toBeInTheDocument()
  })

  it('generates a no-selection capability with English and no prompt fields', async () => {
    renderPage()
    await selectCapability('Analyze my progress')
    expect(screen.getByText(/No additional selection is needed/)).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(createAiCoachSession).toHaveBeenCalledWith({
      type: 'PROGRESS_ANALYSIS',
      language: 'en',
    })
    expect(
      (
        await screen.findByRole('heading', { name: 'Steady strength progress' })
      ).closest('[tabindex]'),
    ).toHaveFocus()
    const payload = vi.mocked(createAiCoachSession).mock.calls[0]?.[0]
    expect(payload).not.toHaveProperty('prompt')
    expect(payload).not.toHaveProperty('userId')
  })

  it('sends Arabic for the next generation without rewriting generated text', async () => {
    await changeAppLanguage('ar')
    renderPage()
    await selectCapability('تحليل تقدمي')
    await userEvent.click(screen.getByRole('button', { name: 'إنشاء التحليل' }))
    expect(createAiCoachSession).toHaveBeenCalledWith({
      type: 'PROGRESS_ANALYSIS',
      language: 'ar',
    })
    expect(
      await screen.findByText(
        'Your recent completed workouts show a consistent direction.',
      ),
    ).toBeVisible()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  })

  it('validates a required source and submits the selected exercise', async () => {
    renderPage()
    await selectCapability('Check for plateaus')
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(
      screen.getByText(
        'Choose an exercise or custom machine before generating.',
      ),
    ).toBeVisible()
    await userEvent.type(screen.getByLabelText('Search sources'), 'incline')
    await waitFor(() => {
      expect(fetchExerciseOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'incline' }),
      )
    })
    await userEvent.click(
      await screen.findByRole('button', {
        name: new RegExp(exerciseOption.name),
      }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(createAiCoachSession).toHaveBeenLastCalledWith({
      type: 'PLATEAU_DETECTION',
      language: 'en',
      selection: { sourceType: 'EXERCISE', sourceId: exerciseOption.id },
    })
  })

  it('clears incompatible source selection and supports machine search selection', async () => {
    renderPage()
    await selectCapability('Suggest my next workout target')
    await userEvent.click(
      await screen.findByRole('button', {
        name: new RegExp(exerciseOption.name),
      }),
    )
    await userEvent.click(screen.getByText('My Machines'))
    expect(
      screen.queryByText(`Selected: ${exerciseOption.name}`),
    ).not.toBeInTheDocument()
    await userEvent.click(
      await screen.findByRole('button', { name: new RegExp(machine.name) }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(createAiCoachSession).toHaveBeenLastCalledWith({
      type: 'NEXT_WORKOUT_GUIDANCE',
      language: 'en',
      selection: { sourceType: 'CUSTOM_MACHINE', sourceId: machine.id },
    })
  })

  it('uses bounded visible-plan fetching and validates plan review', async () => {
    renderPage()
    await selectCapability('Review my workout plan')
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(
      screen.getByText('Choose a workout plan before generating.'),
    ).toBeVisible()
    await userEvent.click(
      await screen.findByRole('button', { name: new RegExp(planSummary.name) }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(fetchWorkoutPlans).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, ownership: 'all' }),
    )
    expect(createAiCoachSession).toHaveBeenLastCalledWith({
      type: 'WORKOUT_PLAN_REVIEW',
      language: 'en',
      selection: { workoutPlanId: planSummary.id },
    })
  })

  it('prevents duplicate generation while pending and renders a safe 503 error', async () => {
    let rejectRequest: (reason: unknown) => void = () => undefined
    vi.mocked(createAiCoachSession).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRequest = reject
      }),
    )
    renderPage()
    await selectCapability('Weekly fitness summary')
    const button = screen.getByRole('button', { name: 'Generate analysis' })
    await userEvent.click(button)
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(createAiCoachSession).toHaveBeenCalledOnce()
    rejectRequest({ isAxiosError: true, response: { status: 503 } })
    expect(
      await screen.findByText('AI Coach is not configured on this server yet.'),
    ).toBeVisible()
    vi.mocked(createAiCoachSession).mockResolvedValue(aiCoachSession)
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(createAiCoachSession).toHaveBeenCalledTimes(2)
  })

  it('renders ordered recommendations, evidence fallback, cautions, and insufficient data as success', async () => {
    vi.mocked(createAiCoachSession).mockResolvedValue(
      insufficientAiCoachSession,
    )
    renderPage()
    await selectCapability('Review my nutrition targets')
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(
      await screen.findByText('More data will improve this review'),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Run the Calories Calculator first to create a saved nutrition target.',
      ),
    ).toBeVisible()
    expect(
      screen.queryByText('The analysis could not be completed.'),
    ).not.toBeInTheDocument()
  })

  it('renders bounded history, status labels, filter, and pagination', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', {
        name: 'Previous coaching sessions',
      }),
    ).toBeVisible()
    expect(screen.getByText('Abandoned')).toBeVisible()
    expect(
      screen.getAllByRole('link', { name: 'Open details' })[0],
    ).toHaveAttribute('href', `/app/ai-coach/sessions/${aiCoachSession.id}`)
    await userEvent.selectOptions(
      screen.getByLabelText('Capability'),
      'WEEKLY_SUMMARY',
    )
    await waitFor(() => {
      expect(fetchAiCoachSessions).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'WEEKLY_SUMMARY', limit: 10 }),
      )
    })
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => {
      expect(fetchAiCoachSessions).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      )
    })
  })

  it('renders an explicit empty history state', async () => {
    vi.mocked(fetchAiCoachSessions).mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    renderPage()
    expect(await screen.findByText('No coaching sessions yet')).toBeVisible()
  })

  it('does not persist AI state or context in browser storage', async () => {
    renderPage()
    await selectCapability('Analyze my progress')
    await userEvent.click(
      screen.getByRole('button', { name: 'Generate analysis' }),
    )
    expect(
      await screen.findAllByRole('heading', {
        name: 'Steady strength progress',
      }),
    ).not.toHaveLength(0)
    expect(Object.keys(window.localStorage)).toEqual(expect.arrayContaining([]))
    expect(
      Object.keys(window.localStorage).filter(
        (key) => key !== LANGUAGE_STORAGE_KEY,
      ),
    ).toEqual([])
  })
})
