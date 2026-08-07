import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionBuilderPage } from '../src/features/weight-tracker/pages/SessionBuilderPage.js'
import { SessionDetailPage } from '../src/features/weight-tracker/pages/SessionDetailPage.js'
import { SessionsPage } from '../src/features/weight-tracker/pages/SessionsPage.js'
import * as service from '../src/features/weight-tracker/services/weight-tracker.service.js'
import * as exerciseService from '../src/features/exercise-library/services/exercise-library.service.js'
import {
  machine,
  pagination,
  sessionDetail,
  sessionSummary,
} from './fixtures/weight-tracker.fixture.js'
import { exerciseOption } from './fixtures/exercise-library.fixture.js'

vi.mock(
  '../src/features/exercise-library/services/exercise-library.service.js',
  () => ({
    fetchExercise: vi.fn(),
    fetchExerciseFilterOptions: vi.fn(),
    fetchExerciseOptions: vi.fn(),
    fetchExercises: vi.fn(),
  }),
)

const fixtureLog = sessionDetail.exerciseLogs[0]
if (!fixtureLog) throw new Error('Session fixture requires one exercise log')
const fixtureSet = fixtureLog.sets[0]
const secondFixtureSet = fixtureLog.sets[1]
if (!fixtureSet || !secondFixtureSet)
  throw new Error('Session fixture requires two exercise sets')

vi.mock(
  '../src/features/weight-tracker/services/weight-tracker.service.js',
  () => ({
    completeSession: vi.fn(),
    createBulkSession: vi.fn(),
    createLog: vi.fn(),
    createSet: vi.fn(),
    deleteLog: vi.fn(),
    deleteSession: vi.fn(),
    deleteSet: vi.fn(),
    fetchMachines: vi.fn(),
    fetchSession: vi.fn(),
    fetchSessions: vi.fn(),
    reorderLogs: vi.fn(),
    reorderSets: vi.fn(),
    updateLog: vi.fn(),
    updateSession: vi.fn(),
    updateSet: vi.fn(),
  }),
)

const renderBuilder = () =>
  render(
    <MemoryRouter>
      <SessionBuilderPage />
    </MemoryRouter>,
  )
const renderDetail = () =>
  render(
    <MemoryRouter
      initialEntries={[`/app/weights/sessions/${sessionDetail.id}`]}
    >
      <Routes>
        <Route
          path="/app/weights/sessions/:sessionId"
          element={<SessionDetailPage />}
        />
        <Route
          path="/app/weights/sessions"
          element={<p>Sessions destination</p>}
        />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.mocked(service.fetchMachines).mockResolvedValue({
    items: [machine],
    pagination,
  })
  vi.mocked(service.fetchSessions).mockResolvedValue({
    items: [sessionSummary],
    pagination,
  })
  vi.mocked(service.fetchSession).mockResolvedValue(sessionDetail)
  vi.mocked(service.createBulkSession).mockResolvedValue(sessionDetail)
  vi.mocked(service.completeSession).mockResolvedValue(sessionDetail)
  vi.mocked(service.deleteSession).mockResolvedValue(undefined)
  vi.mocked(service.createLog).mockResolvedValue(fixtureLog)
  vi.mocked(service.createSet).mockResolvedValue(fixtureSet)
  vi.mocked(service.updateSet).mockResolvedValue(fixtureSet)
  for (const fn of [
    service.deleteLog,
    service.deleteSet,
    service.reorderLogs,
    service.reorderSets,
  ])
    vi.mocked(fn).mockResolvedValue(undefined)
  vi.mocked(service.updateLog).mockResolvedValue(fixtureLog)
  vi.mocked(service.updateSession).mockResolvedValue(sessionDetail)
  vi.mocked(exerciseService.fetchExerciseOptions).mockResolvedValue([
    exerciseOption,
  ])
})

describe('session list', () => {
  it('renders summaries and filters', async () => {
    const actor = userEvent.setup()
    render(
      <MemoryRouter>
        <SessionsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Push day')).toBeVisible()
    expect(screen.getByText('920 kg volume')).toBeVisible()
    await actor.selectOptions(screen.getByLabelText('Status'), 'true')
    await waitFor(() => {
      expect(service.fetchSessions).toHaveBeenLastCalledWith(
        expect.objectContaining({ completed: true }),
      )
    })
  })
  it('renders an empty state', async () => {
    vi.mocked(service.fetchSessions).mockResolvedValue({
      items: [],
      pagination: { ...pagination, totalItems: 0, totalPages: 0 },
    })
    render(
      <MemoryRouter>
        <SessionsPage />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { name: 'No workouts found' }),
    ).toBeVisible()
  })
})

describe('new workout builder', () => {
  it('requires a real machine source and at least one entry', async () => {
    const actor = userEvent.setup()
    renderBuilder()
    await actor.click(
      await screen.findByRole('button', { name: 'Save workout' }),
    )
    expect(await screen.findByText('Add at least one exercise')).toBeVisible()
    expect(service.createBulkSession).not.toHaveBeenCalled()
  })
  it('adds a machine and multiple sets', async () => {
    const actor = userEvent.setup()
    renderBuilder()
    await actor.click(
      await screen.findByRole('button', { name: 'Add exercise entry' }),
    )
    await actor.selectOptions(
      screen.getByLabelText('Custom machine'),
      machine.id,
    )
    await actor.type(screen.getByLabelText('Set 1 weight kg'), '40')
    await actor.click(screen.getByRole('button', { name: 'Add set' }))
    await actor.type(screen.getByLabelText('Set 2 reps'), '10')
    expect(screen.getByLabelText('Set 2 reps')).toHaveValue(10)
  })
  it('rejects a metric-less set', async () => {
    const actor = userEvent.setup()
    renderBuilder()
    await actor.click(
      await screen.findByRole('button', { name: 'Add exercise entry' }),
    )
    await actor.selectOptions(
      screen.getByLabelText('Custom machine'),
      machine.id,
    )
    await actor.click(screen.getByRole('button', { name: 'Save workout' }))
    expect(
      await screen.findByText('Add at least one performance metric'),
    ).toBeVisible()
  })
  it('saves a bulk workout with unique order and set numbers', async () => {
    const actor = userEvent.setup()
    renderBuilder()
    await actor.click(
      await screen.findByRole('button', { name: 'Add exercise entry' }),
    )
    await actor.selectOptions(
      screen.getByLabelText('Custom machine'),
      machine.id,
    )
    await actor.type(screen.getByLabelText('Set 1 weight kg'), '40')
    await actor.click(screen.getByRole('button', { name: 'Add set' }))
    await actor.type(screen.getByLabelText('Set 2 reps'), '10')
    await actor.click(screen.getByRole('button', { name: 'Save workout' }))
    await waitFor(() => {
      expect(service.createBulkSession).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            expect.objectContaining({
              orderIndex: 0,
              customMachineId: machine.id,
              exerciseId: null,
              sets: [
                expect.objectContaining({ setNumber: 1 }),
                expect.objectContaining({ setNumber: 2 }),
              ],
            }),
          ],
        }),
      )
    })
  })
  it('preserves the draft after a recoverable failure', async () => {
    vi.mocked(service.createBulkSession).mockRejectedValue(
      new Error('private raw error'),
    )
    const actor = userEvent.setup()
    renderBuilder()
    await actor.click(
      await screen.findByRole('button', { name: 'Add exercise entry' }),
    )
    await actor.selectOptions(
      screen.getByLabelText('Custom machine'),
      machine.id,
    )
    await actor.type(screen.getByLabelText('Set 1 weight kg'), '42.5')
    await actor.click(screen.getByRole('button', { name: 'Save workout' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'entries are still here',
    )
    expect(screen.getByLabelText('Set 1 weight kg')).toHaveValue(42.5)
    expect(screen.queryByText('private raw error')).not.toBeInTheDocument()
  })
  it('offers both source types and searches bounded library options', async () => {
    const actor = userEvent.setup()
    renderBuilder()
    await actor.click(
      await screen.findByRole('button', { name: 'Add exercise entry' }),
    )
    expect(
      screen.getByRole('radio', { name: 'Exercise Library' }),
    ).toBeVisible()
    expect(screen.getByRole('radio', { name: 'My Machines' })).toBeVisible()
    await actor.click(screen.getByRole('radio', { name: 'Exercise Library' }))
    await actor.type(
      screen.getByLabelText('Search Exercise Library'),
      'incline',
    )
    await waitFor(() => {
      expect(exerciseService.fetchExerciseOptions).toHaveBeenLastCalledWith({
        limit: 20,
        search: 'incline',
      })
    })
    expect(
      await screen.findByRole('option', {
        name: /Incline Barbell Bench Press/,
      }),
    ).toBeVisible()
  })
  it('selects a global exercise and submits exactly one source', async () => {
    const actor = userEvent.setup()
    renderBuilder()
    await actor.click(
      await screen.findByRole('button', { name: 'Add exercise entry' }),
    )
    await actor.click(screen.getByRole('radio', { name: 'Exercise Library' }))
    await actor.click(
      await screen.findByRole('option', {
        name: /Incline Barbell Bench Press/,
      }),
    )
    await actor.type(screen.getByLabelText('Set 1 weight kg'), '60')
    await actor.click(screen.getByRole('button', { name: 'Save workout' }))
    await waitFor(() => {
      expect(service.createBulkSession).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            expect.objectContaining({
              exerciseId: exerciseOption.id,
              customMachineId: null,
            }),
          ],
        }),
      )
    })
  })
  it('clears stale source IDs while preserving set data', async () => {
    const actor = userEvent.setup()
    renderBuilder()
    await actor.click(
      await screen.findByRole('button', { name: 'Add exercise entry' }),
    )
    await actor.selectOptions(
      screen.getByLabelText('Custom machine'),
      machine.id,
    )
    await actor.type(screen.getByLabelText('Set 1 weight kg'), '52.5')
    await actor.click(screen.getByRole('radio', { name: 'Exercise Library' }))
    expect(screen.getByLabelText('Set 1 weight kg')).toHaveValue(52.5)
    await actor.click(
      await screen.findByRole('option', {
        name: /Incline Barbell Bench Press/,
      }),
    )
    await actor.click(screen.getByRole('radio', { name: 'My Machines' }))
    expect(screen.getByLabelText('Set 1 weight kg')).toHaveValue(52.5)
    await actor.selectOptions(
      screen.getByLabelText('Custom machine'),
      machine.id,
    )
    await actor.click(screen.getByRole('button', { name: 'Save workout' }))
    await waitFor(() => {
      expect(service.createBulkSession).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            expect.objectContaining({
              exerciseId: null,
              customMachineId: machine.id,
              sets: [expect.objectContaining({ weightKg: 52.5 })],
            }),
          ],
        }),
      )
    })
  })
})

describe('session detail mutations', () => {
  it('renders ordered sets and PR indicators', async () => {
    renderDetail()
    expect(await screen.findByText('Chest Press')).toBeVisible()
    expect(screen.getByText('Personal record')).toBeVisible()
    expect(screen.getByText('40 kg · 10 reps')).toBeVisible()
  })
  it('reorders sets using the complete server contract', async () => {
    const actor = userEvent.setup()
    renderDetail()
    await actor.click(
      await screen.findByRole('button', { name: 'Move set 2 up' }),
    )
    await waitFor(() => {
      expect(service.reorderSets).toHaveBeenCalledWith(fixtureLog.id, [
        { setId: secondFixtureSet.id, setNumber: 1 },
        { setId: fixtureSet.id, setNumber: 2 },
      ])
    })
  })
  it('reorders logs through server confirmation', async () => {
    const secondLog = {
      ...fixtureLog,
      id: '66666666-6666-4666-8666-666666666666',
      orderIndex: 1,
      source: { ...fixtureLog.source, name: 'Row Machine' },
    }
    vi.mocked(service.fetchSession).mockResolvedValue({
      ...sessionDetail,
      exerciseLogs: [fixtureLog, secondLog],
    })
    const actor = userEvent.setup()
    renderDetail()
    await actor.click(
      await screen.findByRole('button', { name: 'Move Row Machine up' }),
    )
    await waitFor(() => {
      expect(service.reorderLogs).toHaveBeenCalled()
    })
  })
  it('adds a machine log to an incomplete workout', async () => {
    vi.mocked(service.fetchSession).mockResolvedValue({
      ...sessionDetail,
      completedAt: null,
      durationMinutes: null,
    })
    const actor = userEvent.setup()
    renderDetail()
    await actor.click(
      await screen.findByRole('button', { name: 'Add machine' }),
    )
    await actor.selectOptions(
      screen.getByLabelText('Machine to add'),
      machine.id,
    )
    await actor.click(screen.getByRole('button', { name: 'Add entry' }))
    await waitFor(() => {
      expect(service.createLog).toHaveBeenCalledWith(
        sessionDetail.id,
        expect.objectContaining({
          customMachineId: machine.id,
          exerciseId: null,
        }),
      )
    })
  })
  it('adds a validated set from workout detail', async () => {
    const actor = userEvent.setup()
    renderDetail()
    await actor.click(await screen.findByRole('button', { name: 'Add set' }))
    await actor.type(screen.getByLabelText('Set 3 weight kg'), '47.5')
    await actor.click(screen.getByRole('button', { name: 'Save set' }))
    await waitFor(() => {
      expect(service.createSet).toHaveBeenCalledWith(
        fixtureLog.id,
        expect.objectContaining({ setNumber: 3, weightKg: 47.5 }),
      )
    })
  })
  it('confirms set deletion before calling the API', async () => {
    const actor = userEvent.setup()
    renderDetail()
    await actor.click(
      await screen.findByRole('button', { name: 'Delete set 1' }),
    )
    expect(service.deleteSet).not.toHaveBeenCalled()
    await actor.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete set',
      }),
    )
    await waitFor(() => {
      expect(service.deleteSet).toHaveBeenCalledWith(fixtureSet.id)
    })
  })
  it('confirms log deletion before deleting its aggregate', async () => {
    const actor = userEvent.setup()
    renderDetail()
    await actor.click(
      await screen.findByRole('button', { name: 'Delete Chest Press' }),
    )
    expect(service.deleteLog).not.toHaveBeenCalled()
    await actor.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete entry',
      }),
    )
    await waitFor(() => {
      expect(service.deleteLog).toHaveBeenCalledWith(fixtureLog.id)
    })
  })
  it('completes an incomplete workout once', async () => {
    vi.mocked(service.fetchSession).mockResolvedValue({
      ...sessionDetail,
      completedAt: null,
      durationMinutes: null,
    })
    const actor = userEvent.setup()
    renderDetail()
    await actor.click(
      await screen.findByRole('button', { name: 'Complete workout' }),
    )
    await actor.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Complete workout',
      }),
    )
    await waitFor(() => {
      expect(service.completeSession).toHaveBeenCalledOnce()
    })
  })
  it('deletes the session after confirmation', async () => {
    const actor = userEvent.setup()
    renderDetail()
    await actor.click(await screen.findByRole('button', { name: 'Delete' }))
    await actor.click(screen.getByRole('button', { name: 'Delete workout' }))
    await waitFor(() => {
      expect(service.deleteSession).toHaveBeenCalledWith(sessionDetail.id)
    })
  })
})
