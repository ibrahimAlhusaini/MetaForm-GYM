import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExerciseDetailPage } from '../src/features/exercise-library/pages/ExerciseDetailPage.js'
import * as service from '../src/features/exercise-library/services/exercise-library.service.js'
import { exerciseDetail } from './fixtures/exercise-library.fixture.js'

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
    <MemoryRouter initialEntries={[`/app/exercises/${exerciseDetail.id}`]}>
      <Routes>
        <Route
          path="/app/exercises/:exerciseId"
          element={<ExerciseDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(service.fetchExercise).mockResolvedValue(exerciseDetail)
})

describe('Exercise detail', () => {
  it('shows the loading state', () => {
    vi.mocked(service.fetchExercise).mockReturnValue(
      new Promise(() => undefined),
    )
    renderPage()
    expect(screen.getByText('Loading exercise details')).toBeVisible()
  })

  it('renders classification, recommendations, and safe semantic lists', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', { name: exerciseDetail.name }),
    ).toBeVisible()
    expect(screen.getByText('Upper chest')).toBeVisible()
    expect(screen.getByText('4 sets × 8–12')).toBeVisible()
    expect(
      screen
        .getByRole('heading', { name: 'Instructions' })
        .parentElement?.querySelector('ol'),
    ).toBeInTheDocument()
    expect(screen.getByText('Set the bench to a low incline.')).toBeVisible()
    expect(
      screen
        .getByRole('heading', { name: 'Common mistakes' })
        .parentElement?.querySelector('ul'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('[dangerouslySetInnerHTML]'),
    ).not.toBeInTheDocument()
  })

  it('uses the returned URL in a controlled native video', async () => {
    renderPage()
    const video = await screen.findByLabelText(
      `${exerciseDetail.name} demonstration video`,
    )
    expect(video).toHaveAttribute('controls')
    expect(video).not.toHaveAttribute('autoplay')
    expect(video).toHaveAttribute('poster', exerciseDetail.thumbnailUrl)
    expect(video.querySelector('source')).toHaveAttribute(
      'src',
      exerciseDetail.videoUrl,
    )
  })

  it('renders a professional video-unavailable state', async () => {
    vi.mocked(service.fetchExercise).mockResolvedValue({
      ...exerciseDetail,
      videoUrl: null,
    })
    renderPage()
    expect(await screen.findByText('Video unavailable')).toBeVisible()
    expect(screen.queryByRole('video')).not.toBeInTheDocument()
  })

  it('handles missing optional content safely', async () => {
    vi.mocked(service.fetchExercise).mockResolvedValue({
      ...exerciseDetail,
      description: null,
      muscleSubgroup: null,
      secondaryMuscles: [],
      recommendedSets: null,
      recommendedReps: null,
      thumbnailUrl: null,
      instructions: [],
      commonMistakes: [],
    })
    renderPage()
    expect(
      await screen.findByText(
        'No written instructions are available for this exercise.',
      ),
    ).toBeVisible()
    expect(
      screen.getByText('No common mistakes have been documented.'),
    ).toBeVisible()
    expect(screen.getByText('None specified')).toBeVisible()
    expect(screen.getByText('Not classified')).toBeVisible()
  })

  it('shows a safe not-found error and retries', async () => {
    vi.mocked(service.fetchExercise).mockRejectedValueOnce(
      new Error('Axios 404 private payload'),
    )
    renderPage()
    expect(
      await screen.findByText(
        'This exercise could not be found or is no longer available.',
      ),
    ).toBeVisible()
    expect(
      screen.queryByText('Axios 404 private payload'),
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('heading', { name: exerciseDetail.name }),
    ).toBeVisible()
  })
})
