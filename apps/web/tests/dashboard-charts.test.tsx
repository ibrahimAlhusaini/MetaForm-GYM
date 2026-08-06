import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type {
  BodyWeightTrendDirection,
  DashboardSummaryData,
} from '@metaform/shared-types'
import { BodyWeightChart } from '../src/features/dashboard/components/BodyWeightChart.js'
import { StrengthProgressCard } from '../src/features/dashboard/components/StrengthProgressCard.js'
import { StrengthProgressSection } from '../src/features/dashboard/components/StrengthProgressSection.js'
import {
  emptyDashboardData,
  populatedDashboardData,
  strengthItem,
} from './fixtures/dashboard.fixture.js'

const bodyProgressWithTrend = (
  direction: BodyWeightTrendDirection,
): DashboardSummaryData['bodyWeightProgress'] => ({
  ...populatedDashboardData.bodyWeightProgress,
  trend: {
    ...populatedDashboardData.bodyWeightProgress.trend,
    direction,
    ...(direction === 'INSUFFICIENT_DATA'
      ? { changeKg: null, percentageChange: null }
      : {}),
  },
})

describe('dashboard charts and strength cards', () => {
  it('renders the body-weight chart with returned points', () => {
    render(
      <BodyWeightChart progress={populatedDashboardData.bodyWeightProgress} />,
    )

    expect(
      screen.getByRole('img', { name: /Body weight line chart/ }),
    ).toBeVisible()
    expect(screen.getByText(/2 recorded measurements/)).toBeVisible()
  })

  it('renders the body-weight empty state without a chart', () => {
    render(<BodyWeightChart progress={emptyDashboardData.bodyWeightProgress} />)

    expect(screen.getByText('No body-weight history yet')).toBeVisible()
    expect(
      screen.queryByRole('img', { name: /Body weight line chart/ }),
    ).not.toBeInTheDocument()
  })

  it('renders an increasing trend descriptively', () => {
    render(<BodyWeightChart progress={bodyProgressWithTrend('INCREASING')} />)
    expect(screen.getByText('Increasing')).toBeVisible()
    expect(screen.getByText('Change +1.5 kg')).toBeVisible()
  })

  it('renders a decreasing trend descriptively', () => {
    render(
      <BodyWeightChart
        progress={{
          ...bodyProgressWithTrend('DECREASING'),
          trend: {
            direction: 'DECREASING',
            changeKg: -1.5,
            percentageChange: -1.91,
          },
        }}
      />,
    )
    expect(screen.getByText('Decreasing')).toBeVisible()
    expect(screen.getByText('Change -1.5 kg')).toBeVisible()
  })

  it('renders a stable trend', () => {
    render(<BodyWeightChart progress={bodyProgressWithTrend('STABLE')} />)
    expect(screen.getByText('Stable')).toBeVisible()
  })

  it('renders an insufficient-data trend', () => {
    render(
      <BodyWeightChart progress={bodyProgressWithTrend('INSUFFICIENT_DATA')} />,
    )
    expect(screen.getByText('Insufficient data')).toBeVisible()
  })

  it('renders a strength progress card', () => {
    render(<StrengthProgressCard item={strengthItem} />)

    expect(screen.getByRole('heading', { name: 'Bench Press' })).toBeVisible()
    expect(screen.getByText('Exercise')).toBeVisible()
    expect(screen.getByText('4 sessions')).toBeVisible()
    expect(screen.getAllByText('60 kg')).toHaveLength(2)
  })

  it('renders a fallback when the strength image is missing', () => {
    render(<StrengthProgressCard item={{ ...strengthItem, imageUrl: null }} />)

    expect(
      screen.getByRole('img', { name: 'Bench Press image unavailable' }),
    ).toBeVisible()
  })

  it('renders a missing previous load safely', () => {
    render(
      <StrengthProgressCard
        item={{
          ...strengthItem,
          previousWeightKg: null,
          changeKg: null,
          percentageChange: null,
        }}
      />,
    )

    expect(screen.getByText('Previous comparison unavailable')).toBeVisible()
    expect(screen.getByText('Not available')).toBeVisible()
  })

  it('supports a one-point strength chart', () => {
    render(
      <StrengthProgressCard
        item={{
          ...strengthItem,
          totalSessions: 1,
          previousWeightKg: null,
          changeKg: null,
          percentageChange: null,
          points: [{ date: '2026-08-05', weightKg: 60 }],
        }}
      />,
    )

    expect(screen.getByText(/1 representative session point/)).toBeVisible()
    expect(
      screen.getByRole('img', { name: /Bench Press load progression chart/ }),
    ).toBeVisible()
  })

  it('renders the strength section empty state', () => {
    render(<StrengthProgressSection machines={[]} />)
    expect(screen.getByText('No strength history yet')).toBeVisible()
  })

  it('keeps equal display names as separate strength sources', () => {
    render(
      <StrengthProgressSection
        machines={[
          strengthItem,
          {
            ...strengthItem,
            sourceType: 'CUSTOM_MACHINE',
            sourceId: '0f58f875-230a-49ef-845a-a6047695b79f',
          },
        ]}
      />,
    )

    expect(
      screen.getAllByRole('heading', { name: 'Bench Press' }),
    ).toHaveLength(2)
    expect(screen.getByText('Exercise')).toBeVisible()
    expect(screen.getByText('Custom machine')).toBeVisible()
  })

  it('renders chart summaries so values are not visual-only', () => {
    render(<StrengthProgressCard item={strengthItem} />)
    expect(
      screen.getByText('2 representative session points. Latest load 60 kg.'),
    ).toBeVisible()
  })
})
