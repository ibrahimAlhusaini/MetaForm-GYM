import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExerciseLibraryPage } from '../src/features/exercise-library/pages/ExerciseLibraryPage.js'
import * as service from '../src/features/exercise-library/services/exercise-library.service.js'
import {
  exercise,
  exerciseFilterOptions,
  exercisePagination,
} from './fixtures/exercise-library.fixture.js'

vi.mock(
  '../src/features/exercise-library/services/exercise-library.service.js',
  () => ({
    fetchExercise: vi.fn(),
    fetchExerciseFilterOptions: vi.fn(),
    fetchExerciseOptions: vi.fn(),
    fetchExercises: vi.fn(),
  }),
)

const renderPage = () =>
  render(
    <MemoryRouter>
      <ExerciseLibraryPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(service.fetchExerciseFilterOptions).mockResolvedValue(
    exerciseFilterOptions,
  )
  vi.mocked(service.fetchExercises).mockResolvedValue({
    items: [exercise],
    pagination: exercisePagination,
  })
})

describe('Exercise Library list', () => {
  it('shows filter and list loading states', () => {
    vi.mocked(service.fetchExerciseFilterOptions).mockReturnValue(
      new Promise(() => undefined),
    )
    vi.mocked(service.fetchExercises).mockReturnValue(
      new Promise(() => undefined),
    )
    renderPage()
    expect(screen.getByText('Loading exercise filters')).toBeVisible()
    expect(screen.getByText('Loading published exercises')).toBeVisible()
  })

  it('shows a safe list error and retries', async () => {
    vi.mocked(service.fetchExercises).mockRejectedValueOnce(
      new Error('raw database error'),
    )
    renderPage()
    expect(
      await screen.findByText(
        'We could not load the exercise library. Please try again.',
      ),
    ).toBeVisible()
    expect(screen.queryByText('raw database error')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(exercise.name)).toBeVisible()
    expect(service.fetchExercises).toHaveBeenCalledTimes(2)
  })

  it('shows filter-options failure independently and retries', async () => {
    vi.mocked(service.fetchExerciseFilterOptions).mockRejectedValueOnce(
      new Error('private'),
    )
    renderPage()
    expect(
      await screen.findByText(
        'We could not load exercise filters. Please try again.',
      ),
    ).toBeVisible()
    expect(screen.getByText(exercise.name)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByLabelText('Primary muscle')).toBeVisible()
  })

  it('renders the empty published state', async () => {
    vi.mocked(service.fetchExercises).mockResolvedValue({
      items: [],
      pagination: { ...exercisePagination, totalItems: 0, totalPages: 0 },
    })
    renderPage()
    expect(
      await screen.findByRole('heading', {
        name: 'No published exercises yet',
      }),
    ).toBeVisible()
  })

  it('renders published cards and recommendations', async () => {
    renderPage()
    expect(await screen.findByText(exercise.name)).toBeVisible()
    expect(screen.getByText('4 sets × 8–12')).toBeVisible()
    expect(
      screen.getByRole('link', { name: `View details for ${exercise.name}` }),
    ).toHaveAttribute('href', `/app/exercises/${exercise.id}`)
  })

  it('renders a fallback when the thumbnail is missing', async () => {
    vi.mocked(service.fetchExercises).mockResolvedValue({
      items: [{ ...exercise, thumbnailUrl: null }],
      pagination: exercisePagination,
    })
    renderPage()
    expect(
      await screen.findByRole('img', {
        name: `${exercise.name} exercise thumbnail unavailable`,
      }),
    ).toBeVisible()
  })

  it('submits search without requesting on every keystroke', async () => {
    const actor = userEvent.setup()
    renderPage()
    const input = await screen.findByLabelText('Search exercises')
    await actor.type(input, 'incline')
    expect(service.fetchExercises).toHaveBeenCalledTimes(1)
    await actor.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => {
      expect(service.fetchExercises).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'incline', page: 1 }),
      )
    })
  })

  it.each([
    ['Primary muscle', 'CHEST', { primaryMuscle: 'CHEST' }],
    ['Equipment', 'BARBELL', { equipmentType: 'BARBELL' }],
    ['Difficulty', 'INTERMEDIATE', { difficultyLevel: 'INTERMEDIATE' }],
    ['Movement', 'COMPOUND', { movementType: 'COMPOUND' }],
  ])('applies the %s filter', async (label, value, expected) => {
    const actor = userEvent.setup()
    renderPage()
    await actor.selectOptions(await screen.findByLabelText(label), value)
    await waitFor(() => {
      expect(service.fetchExercises).toHaveBeenLastCalledWith(
        expect.objectContaining({ ...expected, page: 1 }),
      )
    })
  })

  it('uses backend subgroup options and clears an incompatible subgroup', async () => {
    const actor = userEvent.setup()
    renderPage()
    const primary = await screen.findByLabelText('Primary muscle')
    const subgroup = screen.getByLabelText('Muscle subgroup')
    expect(subgroup).toBeDisabled()
    await actor.selectOptions(primary, 'CHEST')
    expect(screen.getByRole('option', { name: 'Upper chest' })).toBeVisible()
    expect(
      screen.queryByRole('option', { name: 'Lats' }),
    ).not.toBeInTheDocument()
    await actor.selectOptions(subgroup, 'UPPER_CHEST')
    await waitFor(() => {
      expect(service.fetchExercises).toHaveBeenLastCalledWith(
        expect.objectContaining({ muscleSubgroup: 'UPPER_CHEST' }),
      )
    })
    await actor.selectOptions(primary, 'BACK')
    expect(subgroup).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Lats' })).toBeVisible()
    await waitFor(() => {
      expect(service.fetchExercises).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ muscleSubgroup: 'UPPER_CHEST' }),
      )
    })
  })

  it('composes filters and clears them together', async () => {
    const actor = userEvent.setup()
    renderPage()
    await actor.selectOptions(
      await screen.findByLabelText('Primary muscle'),
      'CHEST',
    )
    await actor.selectOptions(
      screen.getByLabelText('Muscle subgroup'),
      'UPPER_CHEST',
    )
    await actor.selectOptions(screen.getByLabelText('Equipment'), 'BARBELL')
    await actor.selectOptions(
      screen.getByLabelText('Difficulty'),
      'INTERMEDIATE',
    )
    await actor.selectOptions(screen.getByLabelText('Movement'), 'COMPOUND')
    await waitFor(() => {
      expect(service.fetchExercises).toHaveBeenLastCalledWith(
        expect.objectContaining({
          primaryMuscle: 'CHEST',
          muscleSubgroup: 'UPPER_CHEST',
          equipmentType: 'BARBELL',
          difficultyLevel: 'INTERMEDIATE',
          movementType: 'COMPOUND',
        }),
      )
    })
    await actor.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByLabelText('Primary muscle')).toHaveValue('')
    await waitFor(() => {
      expect(service.fetchExercises).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ primaryMuscle: 'CHEST' }),
      )
    })
  })

  it('uses stable bounded pagination', async () => {
    vi.mocked(service.fetchExercises).mockResolvedValue({
      items: [exercise],
      pagination: {
        ...exercisePagination,
        totalItems: 14,
        totalPages: 2,
        hasNextPage: true,
      },
    })
    const actor = userEvent.setup()
    renderPage()
    await actor.click(await screen.findByRole('button', { name: 'Next page' }))
    await waitFor(() => {
      expect(service.fetchExercises).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 12,
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      )
    })
  })
})
