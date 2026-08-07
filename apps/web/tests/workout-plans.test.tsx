import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkoutPlansPage } from '../src/features/workout-plans/pages/WorkoutPlansPage.js'
import { WorkoutPlanDetailPage } from '../src/features/workout-plans/pages/WorkoutPlanDetailPage.js'
import { WorkoutPlanCreatePage } from '../src/features/workout-plans/pages/WorkoutPlanCreatePage.js'
import { WorkoutPlanEditPage } from '../src/features/workout-plans/pages/WorkoutPlanEditPage.js'
import { SessionBuilderPage } from '../src/features/weight-tracker/pages/SessionBuilderPage.js'
import * as service from '../src/features/workout-plans/services/workout-plans.service.js'
import * as exerciseService from '../src/features/exercise-library/services/exercise-library.service.js'
import * as weightService from '../src/features/weight-tracker/services/weight-tracker.service.js'
import { changeAppLanguage } from '../src/i18n/index.js'
import { exerciseOption } from './fixtures/exercise-library.fixture.js'
import {
  ownedPlanDetail,
  ownedPlanSummary,
  planDetail,
  planPagination,
  planSummary,
} from './fixtures/workout-plans.fixture.js'
import { pagination, sessionDetail } from './fixtures/weight-tracker.fixture.js'

vi.mock(
  '../src/features/workout-plans/services/workout-plans.service.js',
  () => ({
    fetchWorkoutPlans: vi.fn(),
    fetchWorkoutPlanTemplates: vi.fn(),
    fetchWorkoutPlan: vi.fn(),
    createWorkoutPlan: vi.fn(),
    updateWorkoutPlan: vi.fn(),
    cloneWorkoutPlan: vi.fn(),
    deleteWorkoutPlan: vi.fn(),
    createWorkoutPlanDay: vi.fn(),
    updateWorkoutPlanDay: vi.fn(),
    deleteWorkoutPlanDay: vi.fn(),
    reorderWorkoutPlanDays: vi.fn(),
    createPlannedExercise: vi.fn(),
    updatePlannedExercise: vi.fn(),
    deletePlannedExercise: vi.fn(),
    reorderPlannedExercises: vi.fn(),
  }),
)
vi.mock(
  '../src/features/exercise-library/services/exercise-library.service.js',
  () => ({
    fetchExerciseOptions: vi.fn(),
    fetchExercise: vi.fn(),
    fetchExerciseFilterOptions: vi.fn(),
    fetchExercises: vi.fn(),
  }),
)
vi.mock(
  '../src/features/weight-tracker/services/weight-tracker.service.js',
  () => ({ fetchMachines: vi.fn(), createBulkSession: vi.fn() }),
)

const listData = { items: [planSummary], pagination: planPagination }
const renderRoute = (path: string, element: ReactNode, pattern = path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={element} />
        <Route path="/app/plans/:planId" element={<p>Plan destination</p>} />
        <Route path="/app/plans" element={<p>Plans destination</p>} />
        <Route
          path="/app/weights/sessions/:sessionId"
          element={<p>Session destination</p>}
        />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(async () => {
  vi.clearAllMocks()
  await changeAppLanguage('en')
  vi.mocked(service.fetchWorkoutPlanTemplates).mockResolvedValue(listData)
  vi.mocked(service.fetchWorkoutPlans).mockResolvedValue({
    items: [ownedPlanSummary],
    pagination: planPagination,
  })
  vi.mocked(service.fetchWorkoutPlan).mockResolvedValue(planDetail)
  vi.mocked(service.createWorkoutPlan).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.updateWorkoutPlan).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.cloneWorkoutPlan).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.deleteWorkoutPlan).mockResolvedValue(undefined)
  vi.mocked(service.reorderWorkoutPlanDays).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.reorderPlannedExercises).mockResolvedValue(ownedPlanDetail)
  vi.mocked(exerciseService.fetchExerciseOptions).mockResolvedValue([
    exerciseOption,
  ])
  vi.mocked(weightService.fetchMachines).mockResolvedValue({
    items: [],
    pagination,
  })
  vi.mocked(weightService.createBulkSession).mockResolvedValue(sessionDetail)
})

describe('Workout Plans discovery', () => {
  it('handles loading, safe error/retry, empty state, filters, sorting and pagination', async () => {
    vi.mocked(service.fetchWorkoutPlanTemplates)
      .mockRejectedValueOnce(new Error('private Axios details'))
      .mockResolvedValueOnce({
        items: [],
        pagination: { ...planPagination, totalItems: 0, totalPages: 0 },
      })
    render(
      <MemoryRouter>
        <WorkoutPlansPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Loading workout plans')).toBeVisible()
    expect(
      await screen.findByText(/could not load ready-made plans/),
    ).toBeVisible()
    expect(screen.queryByText('private Axios details')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('No ready-made plans found')).toBeVisible()
    expect(screen.getByLabelText('Search plans')).toBeVisible()
    expect(screen.getByLabelText('Difficulty')).toBeVisible()
    expect(screen.getByLabelText('Sort plans')).toBeVisible()
  })

  it('renders templates and owned plans with correct ownership controls and bounded queries', async () => {
    const actor = userEvent.setup()
    render(
      <MemoryRouter>
        <WorkoutPlansPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText(planSummary.name)).toBeVisible()
    expect(screen.getByText('System template')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: `Delete ${planSummary.name}` }),
    ).not.toBeInTheDocument()
    await actor.click(screen.getByRole('tab', { name: 'My plans' }))
    expect(await screen.findByText(ownedPlanSummary.name)).toBeVisible()
    expect(
      screen.getByRole('button', { name: `Delete ${ownedPlanSummary.name}` }),
    ).toBeVisible()
    expect(service.fetchWorkoutPlans).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 12, ownership: 'mine' }),
    )
    await actor.type(screen.getByLabelText('Search plans'), 'strength')
    await waitFor(
      () => {
        expect(service.fetchWorkoutPlans).toHaveBeenLastCalledWith(
          expect.objectContaining({ search: 'strength' }),
        )
      },
      { timeout: 1000 },
    )
  })

  it('clones and safely deletes through accessible dialogs', async () => {
    const actor = userEvent.setup()
    render(
      <MemoryRouter>
        <WorkoutPlansPage />
      </MemoryRouter>,
    )
    await screen.findByText(planSummary.name)
    await actor.click(
      screen.getByRole('button', { name: `Clone ${planSummary.name}` }),
    )
    const cloneDialog = screen.getByRole('dialog', { name: 'Clone plan' })
    await actor.type(
      within(cloneDialog).getByLabelText('Clone name'),
      'My copy',
    )
    await actor.click(
      within(cloneDialog).getByRole('button', { name: 'Clone plan' }),
    )
    expect(service.cloneWorkoutPlan).toHaveBeenCalledWith(planSummary.id, {
      name: 'My copy',
    })
  })
})

describe('Workout Plan detail and builder', () => {
  it('renders ordered training/rest days, planned exercises and read-only public controls', async () => {
    renderRoute(
      `/app/plans/${planDetail.id}`,
      <WorkoutPlanDetailPage />,
      '/app/plans/:planId',
    )
    expect(
      await screen.findByRole('heading', { name: planDetail.name }),
    ).toBeVisible()
    expect(screen.getByText('Upper body')).toBeVisible()
    expect(screen.getAllByText('Rest day').length).toBeGreaterThan(0)
    expect(screen.getByText(exerciseOption.name)).toBeVisible()
    expect(screen.getByText(/8-12 reps/)).toBeVisible()
    expect(screen.getByText(/read-only/)).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('selects among multiple training days and excludes rest days when starting', async () => {
    const actor = userEvent.setup()
    const firstDay = planDetail.days[0]
    if (!firstDay) throw new Error('Plan fixture requires a training day')
    vi.mocked(service.fetchWorkoutPlan).mockResolvedValue({
      ...planDetail,
      trainingDays: 2,
      totalDays: 3,
      days: [
        ...planDetail.days,
        {
          ...firstDay,
          id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
          dayOfWeek: 'WEDNESDAY',
          name: 'Lower body',
          orderIndex: 2,
        },
      ],
    })
    renderRoute(
      `/app/plans/${planDetail.id}`,
      <WorkoutPlanDetailPage />,
      '/app/plans/:planId',
    )
    await actor.click(
      await screen.findByRole('button', { name: 'Start Workout' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Choose a training day' })
    expect(within(dialog).getByText('Upper body')).toBeVisible()
    expect(within(dialog).getByText('Lower body')).toBeVisible()
    expect(within(dialog).queryByText('Tuesday')).not.toBeInTheDocument()
  })

  it('creates a nested plan, enforces unique days and confirms rest conversion', async () => {
    const actor = userEvent.setup()
    renderRoute('/app/plans/new', <WorkoutPlanCreatePage />)
    await actor.type(screen.getByLabelText('Plan name'), 'My program')
    await actor.click(screen.getByRole('button', { name: 'Add day' }))
    await actor.click(screen.getByRole('button', { name: 'Add exercise' }))
    await actor.type(
      screen.getByPlaceholderText('Search exercise library'),
      'incline',
    )
    await actor.click(
      await screen.findByRole('option', { name: exerciseOption.name }),
    )
    await actor.type(screen.getByLabelText('Sets'), '4')
    await actor.type(screen.getByLabelText('Reps'), '8-12')
    await actor.click(screen.getByLabelText('Rest day'))
    expect(
      screen.getByRole('dialog', { name: 'Convert to a rest day?' }),
    ).toBeVisible()
    await actor.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Rest day')).not.toBeChecked()
    await actor.click(screen.getByRole('button', { name: 'Create plan' }))
    await waitFor(() => {
      expect(service.createWorkoutPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My program',
          days: [
            expect.objectContaining({
              dayOfWeek: 'MONDAY',
              orderIndex: 0,
              exercises: [
                expect.objectContaining({
                  exerciseId: exerciseOption.id,
                  sets: 4,
                  reps: '8-12',
                  orderIndex: 0,
                }),
              ],
            }),
          ],
        }),
      )
    })
  })

  it('localizes plan UI and weekday labels in Arabic RTL', async () => {
    await changeAppLanguage('ar')
    renderRoute(
      `/app/plans/${planDetail.id}`,
      <WorkoutPlanDetailPage />,
      '/app/plans/:planId',
    )
    expect(await screen.findByText('الجدول الأسبوعي')).toBeVisible()
    expect(screen.getByText('الاثنين')).toBeVisible()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  })

  it('prefills Weight Tracker in plan order and submits workoutPlanId without mutating the plan', async () => {
    const actor = userEvent.setup()
    const original = structuredClone(planDetail)
    const trainingDay = planDetail.days[0]
    if (!trainingDay) throw new Error('Plan fixture requires a training day')
    renderRoute(
      `/app/weights/sessions/new?workoutPlanId=${planDetail.id}&planDayId=${trainingDay.id}`,
      <SessionBuilderPage />,
      '/app/weights/sessions/new',
    )
    expect(
      await screen.findByText(/Prefilled from Upper \/ Lower Foundation/),
    ).toBeVisible()
    expect(screen.getByLabelText(/Entry notes/)).toHaveValue(
      'Leave two reps in reserve.Plan guidance: 4 sets · 8-12 reps · 90 sec rest',
    )
    expect(screen.getAllByText(/Set [1-4]/)).toHaveLength(4)
    const weights = screen.getAllByLabelText(/weight kg/i)
    const reps = screen.getAllByLabelText(/reps/i)
    for (let index = 0; index < 4; index += 1) {
      const weight = weights[index]
      const rep = reps[index]
      if (!weight || !rep) throw new Error('Expected four prefilled sets')
      await actor.type(weight, '60')
      await actor.type(rep, '10')
    }
    await actor.click(screen.getByRole('button', { name: 'Save workout' }))
    await waitFor(() => {
      expect(weightService.createBulkSession).toHaveBeenCalledWith(
        expect.objectContaining({
          workoutPlanId: planDetail.id,
          entries: [
            expect.objectContaining({
              exerciseId: exerciseOption.id,
              customMachineId: null,
              orderIndex: 0,
            }),
          ],
        }),
      )
    })
    expect(planDetail).toEqual(original)
  })

  it('redirects non-owned edit routes and exposes focused edit controls for owned plans', async () => {
    renderRoute(
      `/app/plans/${planDetail.id}/edit`,
      <WorkoutPlanEditPage />,
      '/app/plans/:planId/edit',
    )
    expect(await screen.findByText('Plan destination')).toBeVisible()
    vi.mocked(service.fetchWorkoutPlan).mockResolvedValue(ownedPlanDetail)
    renderRoute(
      `/app/plans/${ownedPlanDetail.id}/edit`,
      <WorkoutPlanEditPage />,
      '/app/plans/:planId/edit',
    )
    expect(
      await screen.findByRole('heading', { name: 'Edit workout plan' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Save plan details' }),
    ).toBeVisible()
    expect(
      screen.getAllByRole('button', { name: 'Save day' }).length,
    ).toBeGreaterThan(0)
  })

  it('sends a complete contiguous day reorder and retains confirmed order on failure', async () => {
    const actor = userEvent.setup()
    const firstDay = ownedPlanDetail.days[0]
    const secondDay = ownedPlanDetail.days[1]
    if (!firstDay || !secondDay)
      throw new Error('Plan fixture requires two days')
    vi.mocked(service.fetchWorkoutPlan).mockResolvedValue(ownedPlanDetail)
    vi.mocked(service.reorderWorkoutPlanDays).mockRejectedValueOnce(
      new Error('private conflict'),
    )
    renderRoute(
      `/app/plans/${ownedPlanDetail.id}/edit`,
      <WorkoutPlanEditPage />,
      '/app/plans/:planId/edit',
    )
    await actor.click(
      await screen.findByRole('button', { name: 'Move day 1 down' }),
    )
    expect(service.reorderWorkoutPlanDays).toHaveBeenCalledWith(
      ownedPlanDetail.id,
      {
        items: [
          { dayId: secondDay.id, orderIndex: 0 },
          { dayId: firstDay.id, orderIndex: 1 },
        ],
      },
    )
    expect(await screen.findByText(/could not reorder/i)).toBeVisible()
    expect(screen.getAllByText(/Day [12]/)[0]).toHaveTextContent('Day 1')
  })
})
