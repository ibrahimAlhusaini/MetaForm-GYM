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
const required = <T,>(value: T | undefined, message: string): T => {
  if (value === undefined) throw new Error(message)
  return value
}
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
  vi.mocked(service.createWorkoutPlanDay).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.updateWorkoutPlanDay).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.deleteWorkoutPlanDay).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.createPlannedExercise).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.updatePlannedExercise).mockResolvedValue(ownedPlanDetail)
  vi.mocked(service.deletePlannedExercise).mockResolvedValue(ownedPlanDetail)
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

  it('combines discovery filters, stable sorting, clear behavior, and pagination', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.fetchWorkoutPlanTemplates).mockResolvedValue({
      items: [planSummary],
      pagination: {
        ...planPagination,
        totalItems: 13,
        totalPages: 2,
        hasNextPage: true,
      },
    })
    render(
      <MemoryRouter>
        <WorkoutPlansPage />
      </MemoryRouter>,
    )
    await screen.findByText(planSummary.name)
    await actor.type(screen.getByLabelText('Search plans'), 'power')
    await actor.selectOptions(screen.getByLabelText('Difficulty'), 'ADVANCED')
    await actor.selectOptions(screen.getByLabelText('Sort plans'), 'updatedAt')
    await actor.selectOptions(screen.getByLabelText('Sort order'), 'desc')
    await waitFor(
      () => {
        expect(service.fetchWorkoutPlanTemplates).toHaveBeenLastCalledWith({
          page: 1,
          limit: 12,
          search: 'power',
          difficultyLevel: 'ADVANCED',
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        })
      },
      { timeout: 1000 },
    )
    await actor.click(screen.getByRole('button', { name: 'Next' }))
    expect(service.fetchWorkoutPlanTemplates).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    )
    await actor.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => {
      expect(service.fetchWorkoutPlanTemplates).toHaveBeenLastCalledWith({
        page: 1,
        limit: 12,
        sortBy: 'name',
        sortOrder: 'asc',
      })
    })
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

  it('confirms owned-plan deletion and refreshes My Plans', async () => {
    const actor = userEvent.setup()
    render(
      <MemoryRouter>
        <WorkoutPlansPage />
      </MemoryRouter>,
    )
    await actor.click(await screen.findByRole('tab', { name: 'My plans' }))
    await actor.click(
      await screen.findByRole('button', {
        name: `Delete ${ownedPlanSummary.name}`,
      }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Delete this plan?' })
    await actor.click(
      within(dialog).getByRole('button', { name: 'Delete plan' }),
    )
    await waitFor(() => {
      expect(service.deleteWorkoutPlan).toHaveBeenCalledWith(
        ownedPlanSummary.id,
      )
      expect(service.fetchWorkoutPlans).toHaveBeenCalledTimes(2)
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
      await screen.findByRole('button', {
        name: new RegExp(exerciseOption.name),
      }),
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

  it('shows a safe exercise-picker error and retries without losing the draft', async () => {
    const actor = userEvent.setup()
    vi.mocked(exerciseService.fetchExerciseOptions)
      .mockRejectedValueOnce(new Error('private Axios selector error'))
      .mockResolvedValueOnce([exerciseOption])
    renderRoute('/app/plans/new', <WorkoutPlanCreatePage />)
    await actor.type(screen.getByLabelText('Plan name'), 'Retry plan')
    await actor.click(screen.getByRole('button', { name: 'Add day' }))
    await actor.click(screen.getByRole('button', { name: 'Add exercise' }))
    expect(
      await screen.findByText(/could not load Exercise Library options/i),
    ).toBeVisible()
    expect(
      screen.queryByText(/private Axios selector error/i),
    ).not.toBeInTheDocument()
    await actor.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('button', {
        name: new RegExp(exerciseOption.name),
      }),
    ).toBeVisible()
    expect(screen.getByLabelText('Plan name')).toHaveValue('Retry plan')
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
    expect(
      screen.getByText(
        'Leave two reps in reserve. — Plan guidance: 4 sets · 8-12 reps · 90 sec rest',
      ),
    ).toBeVisible()
    expect(screen.getByLabelText(/Entry notes/)).toHaveValue('')
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
              notes: null,
              orderIndex: 0,
            }),
          ],
        }),
      )
    })
    expect(planDetail).toEqual(original)
  })

  it('keeps unsaved edit children at the end and uses gap-safe create positions', async () => {
    const actor = userEvent.setup()
    const planWithGaps = {
      ...ownedPlanDetail,
      days: ownedPlanDetail.days.map((day, index) => ({
        ...day,
        orderIndex: index === 0 ? 2 : 5,
      })),
    }
    vi.mocked(service.fetchWorkoutPlan).mockResolvedValue(planWithGaps)
    renderRoute(
      `/app/plans/${planWithGaps.id}/edit`,
      <WorkoutPlanEditPage />,
      '/app/plans/:planId/edit',
    )
    await actor.click(await screen.findByRole('button', { name: 'Add day' }))
    const newDay = screen.getByRole('group', { name: 'Day 3' })
    expect(
      within(newDay).getByText('Save this day before adding exercises.'),
    ).toBeVisible()
    expect(
      within(newDay).getByRole('button', { name: 'Move day 3 up' }),
    ).toBeDisabled()
    expect(
      within(newDay).queryByRole('button', { name: 'Add exercise' }),
    ).not.toBeInTheDocument()
    await actor.click(within(newDay).getByRole('button', { name: 'Save day' }))
    expect(service.createWorkoutPlanDay).toHaveBeenCalledWith(
      planWithGaps.id,
      expect.objectContaining({ dayOfWeek: 'WEDNESDAY', orderIndex: 6 }),
    )
  })

  it('does not mix focused edits with ordering mutations', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.fetchWorkoutPlan).mockResolvedValue(ownedPlanDetail)
    renderRoute(
      `/app/plans/${ownedPlanDetail.id}/edit`,
      <WorkoutPlanEditPage />,
      '/app/plans/:planId/edit',
    )
    await screen.findByRole('heading', { name: 'Edit workout plan' })
    const firstDay = required(
      ownedPlanDetail.days[0],
      'Owned plan fixture requires a first day',
    )
    await actor.click(
      required(
        screen.getAllByRole('button', { name: 'Save day' })[0],
        'Expected a save-day control',
      ),
    )
    expect(service.updateWorkoutPlanDay).toHaveBeenCalled()
    const dayInput = vi.mocked(service.updateWorkoutPlanDay).mock.calls[0]?.[1]
    if (!dayInput) throw new Error('Expected a day update payload')
    expect(vi.mocked(service.updateWorkoutPlanDay).mock.calls[0]?.[0]).toBe(
      firstDay.id,
    )
    expect(dayInput).not.toHaveProperty('orderIndex')
    await actor.click(
      required(
        screen.getAllByRole('button', { name: 'Save exercise' })[0],
        'Expected a save-exercise control',
      ),
    )
    const firstExercise = required(
      firstDay.exercises[0],
      'Owned plan fixture requires a first exercise',
    )
    const exerciseInput = vi.mocked(service.updatePlannedExercise).mock
      .calls[0]?.[1]
    if (!exerciseInput) throw new Error('Expected an exercise update payload')
    expect(vi.mocked(service.updatePlannedExercise).mock.calls[0]?.[0]).toBe(
      firstExercise.id,
    )
    expect(exerciseInput).not.toHaveProperty('orderIndex')
  })

  it('preserves unrelated local drafts after a focused mutation succeeds', async () => {
    const actor = userEvent.setup()
    vi.mocked(service.fetchWorkoutPlan).mockResolvedValue(ownedPlanDetail)
    renderRoute(
      `/app/plans/${ownedPlanDetail.id}/edit`,
      <WorkoutPlanEditPage />,
      '/app/plans/:planId/edit',
    )
    const dayNames = await screen.findAllByLabelText(/Custom day name/)
    const secondDayName = required(
      dayNames[1],
      'Expected a second day-name field',
    )
    await actor.clear(secondDayName)
    await actor.type(secondDayName, 'Unsaved recovery day')
    await actor.click(
      required(
        screen.getAllByRole('button', { name: 'Save exercise' })[0],
        'Expected a save-exercise control',
      ),
    )
    await waitFor(() => {
      expect(service.updatePlannedExercise).toHaveBeenCalled()
    })
    expect(secondDayName).toHaveValue('Unsaved recovery day')
  })

  it('creates an appended exercise safely and unlocks reordering after confirmation', async () => {
    const actor = userEvent.setup()
    const trainingDay = required(
      ownedPlanDetail.days[0],
      'Owned plan fixture requires a training day',
    )
    const planWithGap = {
      ...ownedPlanDetail,
      days: [
        {
          ...trainingDay,
          exercises: trainingDay.exercises.map((item) => ({
            ...item,
            orderIndex: 5,
          })),
        },
        ...ownedPlanDetail.days.slice(1),
      ],
    }
    const createdItem = {
      ...required(
        trainingDay.exercises[0],
        'Training day fixture requires an exercise',
      ),
      id: '56565656-5656-4565-8565-565656565656',
      orderIndex: 6,
    }
    const confirmedFirstDay = required(
      planWithGap.days[0],
      'Gap plan fixture requires a first day',
    )
    const confirmed = {
      ...planWithGap,
      days: [
        {
          ...confirmedFirstDay,
          exercises: [...confirmedFirstDay.exercises, createdItem],
        },
        ...planWithGap.days.slice(1),
      ],
    }
    vi.mocked(service.fetchWorkoutPlan).mockResolvedValue(planWithGap)
    vi.mocked(service.createPlannedExercise).mockResolvedValue(confirmed)
    renderRoute(
      `/app/plans/${planWithGap.id}/edit`,
      <WorkoutPlanEditPage />,
      '/app/plans/:planId/edit',
    )
    const firstDay = await screen.findByRole('group', { name: 'Day 1' })
    await actor.click(
      within(firstDay).getByRole('button', { name: 'Add exercise' }),
    )
    const newExercise = within(firstDay).getByRole('group', {
      name: 'Exercise 2',
    })
    expect(
      within(newExercise).getByRole('button', {
        name: 'Move exercise 2 up',
      }),
    ).toBeDisabled()
    await actor.click(
      await within(newExercise).findByRole('button', {
        name: new RegExp(exerciseOption.name),
      }),
    )
    await actor.click(
      within(newExercise).getByRole('button', { name: 'Save exercise' }),
    )
    expect(service.createPlannedExercise).toHaveBeenCalledWith(
      trainingDay.id,
      expect.objectContaining({
        exerciseId: exerciseOption.id,
        orderIndex: 6,
      }),
    )
    await waitFor(() => {
      expect(
        within(firstDay).getByRole('button', {
          name: 'Move exercise 2 up',
        }),
      ).toBeEnabled()
    })
  })

  it('resynchronizes confirmed server data when rest conversion partially fails', async () => {
    const actor = userEvent.setup()
    const trainingDay = required(
      ownedPlanDetail.days[0],
      'Owned plan fixture requires a training day',
    )
    const secondExercise = {
      ...required(
        trainingDay.exercises[0],
        'Training day fixture requires an exercise',
      ),
      id: '12121212-1212-4121-8121-121212121212',
      exercise: {
        ...required(
          trainingDay.exercises[0],
          'Training day fixture requires an exercise',
        ).exercise,
        id: '34343434-3434-4343-8343-343434343434',
        name: 'Cable Row',
      },
      orderIndex: 1,
    }
    const initial = {
      ...ownedPlanDetail,
      days: [
        {
          ...trainingDay,
          exercises: [...trainingDay.exercises, secondExercise],
        },
        ...ownedPlanDetail.days.slice(1),
      ],
    }
    const confirmedAfterFailure = {
      ...initial,
      days: [
        { ...trainingDay, exercises: [secondExercise] },
        ...initial.days.slice(1),
      ],
    }
    vi.mocked(service.fetchWorkoutPlan)
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(confirmedAfterFailure)
    vi.mocked(service.deletePlannedExercise)
      .mockResolvedValueOnce(confirmedAfterFailure)
      .mockRejectedValueOnce(new Error('private partial failure'))
    renderRoute(
      `/app/plans/${initial.id}/edit`,
      <WorkoutPlanEditPage />,
      '/app/plans/:planId/edit',
    )
    await actor.click(
      required(
        (await screen.findAllByLabelText('Rest day'))[0],
        'Expected a rest-day checkbox',
      ),
    )
    await actor.click(
      screen.getByRole('button', { name: 'Remove exercises and convert' }),
    )
    await actor.click(
      required(
        screen.getAllByRole('button', { name: 'Save day' })[0],
        'Expected a save-day control',
      ),
    )
    expect(await screen.findByText(/could not save this change/i)).toBeVisible()
    expect(await screen.findByText('Cable Row')).toBeVisible()
    expect(screen.getAllByLabelText('Rest day')[0]).not.toBeChecked()
    expect(service.fetchWorkoutPlan).toHaveBeenCalledTimes(2)
  })

  it('keeps numeric reps editable, ranges as guidance, and rejects a day without a plan', async () => {
    const numericPlan = {
      ...planDetail,
      days: planDetail.days.map((day, dayIndex) =>
        dayIndex === 0
          ? {
              ...day,
              exercises: day.exercises.map((item) => ({
                ...item,
                sets: 2,
                reps: '10',
              })),
            }
          : day,
      ),
    }
    vi.mocked(service.fetchWorkoutPlan).mockResolvedValue(numericPlan)
    const trainingDay = required(
      numericPlan.days[0],
      'Numeric plan fixture requires a training day',
    )
    const view = renderRoute(
      `/app/weights/sessions/new?workoutPlanId=${numericPlan.id}&planDayId=${trainingDay.id}`,
      <SessionBuilderPage />,
      '/app/weights/sessions/new',
    )
    expect(
      await screen.findAllByRole('spinbutton', { name: /set \d+ reps/i }),
    ).toHaveLength(2)
    for (const input of screen.getAllByRole('spinbutton', { name: /reps/i }))
      expect(input).toHaveValue(10)
    view.unmount()

    renderRoute(
      `/app/weights/sessions/new?planDayId=${trainingDay.id}`,
      <SessionBuilderPage />,
      '/app/weights/sessions/new',
    )
    expect(
      await screen.findByText(
        /could not load this plan into the workout builder/i,
      ),
    ).toBeVisible()
    expect(
      screen.queryByText(/invalid plan selection/i),
    ).not.toBeInTheDocument()
  })

  it('clears source-specific plan guidance while preserving actual set drafts', async () => {
    const actor = userEvent.setup()
    const original = structuredClone(planDetail)
    const trainingDay = required(
      planDetail.days[0],
      'Plan fixture requires a training day',
    )
    renderRoute(
      `/app/weights/sessions/new?workoutPlanId=${planDetail.id}&planDayId=${trainingDay.id}`,
      <SessionBuilderPage />,
      '/app/weights/sessions/new',
    )
    expect(await screen.findByText(/Plan guidance:/)).toBeVisible()
    expect(
      screen.getAllByRole('spinbutton', { name: /weight kg/i }),
    ).toHaveLength(4)
    await actor.click(screen.getByRole('radio', { name: 'My Machines' }))
    expect(screen.queryByText(/Plan guidance:/)).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('spinbutton', { name: /weight kg/i }),
    ).toHaveLength(4)
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
