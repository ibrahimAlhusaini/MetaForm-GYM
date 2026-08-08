import type {
  BodyMeasurementHistoryResponse,
  BodyWeightPredictionData,
} from '@metaform/shared-types'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BodyWeightPage } from '../src/features/body-weight/pages/BodyWeightPage.js'
import * as service from '../src/features/body-weight/services/body-weight.service.js'
import { changeAppLanguage } from '../src/i18n/index.js'

vi.mock('../src/features/body-weight/services/body-weight.service.js', () => ({
  createBodyMeasurement: vi.fn(),
  fetchBodyMeasurements: vi.fn(),
  fetchBodyWeightPrediction: vi.fn(),
}))

const history: BodyMeasurementHistoryResponse['data'] = {
  items: [
    {
      id: 'measurement-2',
      measuredAt: '2026-08-08T08:00:00.000Z',
      weightKg: 82.8,
      createdAt: '2026-08-08T08:00:00.000Z',
    },
    {
      id: 'measurement-1',
      measuredAt: '2026-08-04T08:00:00.000Z',
      weightKg: 83,
      createdAt: '2026-08-04T08:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 30, totalItems: 12, totalPages: 1 },
}

const available: BodyWeightPredictionData = {
  status: 'AVAILABLE',
  previewStatus: 'RESEARCH_PREVIEW',
  method: 'RECENT_TREND',
  methodVersion: 'body-weight-v1-recent-trend-v1',
  forecastHorizonDays: 7,
  predictionDate: '2026-08-08T12:00:00.000Z',
  targetDate: '2026-08-15T12:00:00.000Z',
  predictedWeightKg: 82.4,
  currentWeightKg: 82.8,
  expectedChangeKg: -0.4,
  interval: {
    available: false,
    lowerKg: null,
    upperKg: null,
    coverageTarget: 0.8,
    method: 'EMPIRICAL',
  },
  reliability: {
    priorMeasurementCount: 11,
    recentCadenceDays: 4,
    reasonCodes: [],
  },
  disclaimerCode: 'EXPERIMENTAL_TREND_FORECAST',
}

const createdMeasurement = history.items[0]
if (!createdMeasurement) throw new Error('Body-weight fixture is empty')

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/app/weights/body-weight']}>
      <BodyWeightPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  vi.mocked(service.fetchBodyMeasurements).mockResolvedValue(history)
  vi.mocked(service.fetchBodyWeightPrediction).mockResolvedValue(available)
  vi.mocked(service.createBodyMeasurement).mockResolvedValue(createdMeasurement)
})

describe('body weight research preview', () => {
  it('shows honest loading and AVAILABLE forecast content', async () => {
    vi.mocked(service.fetchBodyWeightPrediction).mockReturnValueOnce(
      new Promise(() => undefined),
    )
    const view = renderPage()
    expect(screen.getByText('Calculating trend forecast…')).toBeVisible()
    view.unmount()
    vi.mocked(service.fetchBodyWeightPrediction).mockResolvedValue(available)
    renderPage()
    expect(await screen.findByText('Research Preview')).toBeVisible()
    expect(screen.getByText('82.4 kg')).toBeVisible()
    expect(screen.getByText('-0.4 kg')).toBeVisible()
    expect(screen.getByText('Based on 12 previous measurements')).toBeVisible()
    expect(
      screen.getByText('Recent cadence: about every 4.0 days'),
    ).toBeVisible()
    expect(screen.getByText(/Prediction range unavailable/)).toBeVisible()
    expect(
      screen.getByText('This forecast is not medical advice.'),
    ).toBeVisible()
    expect(
      screen.queryByText(/machine learning prediction|guaranteed prediction/i),
    ).not.toBeInTheDocument()
  })

  it('renders ABSTAINED with a reason-specific, non-pressuring action', async () => {
    vi.mocked(service.fetchBodyWeightPrediction).mockResolvedValue({
      ...available,
      status: 'ABSTAINED',
      predictedWeightKg: null,
      expectedChangeKg: null,
      reliability: {
        priorMeasurementCount: 2,
        recentCadenceDays: null,
        reasonCodes: ['INSUFFICIENT_PRIOR_HISTORY'],
      },
    })
    renderPage()
    expect(
      await screen.findByText('A trend forecast is not available yet.'),
    ).toBeVisible()
    expect(
      screen.getByText(/Add body-weight measurements over time/),
    ).toBeVisible()
    expect(screen.queryByText('0.0 kg')).not.toBeInTheDocument()
  })

  it('shows a localized safe service-unavailable state', async () => {
    vi.mocked(service.fetchBodyWeightPrediction).mockRejectedValue(
      new Error('localhost private traceback'),
    )
    renderPage()
    expect(
      await screen.findByText('The trend forecast is temporarily unavailable.'),
    ).toBeVisible()
    expect(screen.queryByText(/localhost|traceback/i)).not.toBeInTheDocument()
  })

  it('validates the form and refreshes history and prediction after save', async () => {
    const actor = userEvent.setup()
    renderPage()
    const weight = screen.getByLabelText('Body weight (kg)')
    await actor.type(weight, '20')
    await actor.click(screen.getByRole('button', { name: 'Save measurement' }))
    expect(
      screen.getByText('Enter a body weight between 30 and 350 kg.'),
    ).toBeVisible()
    expect(service.createBodyMeasurement).not.toHaveBeenCalled()
    await actor.clear(weight)
    await actor.type(weight, '82.5')
    await actor.click(screen.getByRole('button', { name: 'Save measurement' }))
    await waitFor(() => {
      expect(service.createBodyMeasurement).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(service.fetchBodyMeasurements).toHaveBeenCalledTimes(2)
      expect(service.fetchBodyWeightPrediction).toHaveBeenCalledTimes(2)
    })
  })

  it('keeps chart chronology explicit, accessible, and out of localStorage', async () => {
    renderPage()
    const chart = await screen.findByRole('img', {
      name: /Body-weight history chart/,
    })
    expect(chart).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText(/12 measurements recorded/)).toBeVisible()
    expect(
      Object.keys(window.localStorage).filter((key) =>
        /weight|prediction|history/i.test(key),
      ),
    ).toEqual([])
  })

  it('renders professional Arabic and RTL without changing time direction', async () => {
    await act(() => changeAppLanguage('ar'))
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'وزن الجسم', level: 1 }),
    ).toBeVisible()
    expect(screen.getByText('نسخة تجريبية بحثية')).toBeVisible()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(
      await screen.findByRole('img', { name: /مخطط سجل وزن الجسم/ }),
    ).toHaveAttribute('dir', 'ltr')
  })
})
