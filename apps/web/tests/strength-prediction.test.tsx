import type { StrengthPredictionData } from '@metaform/shared-types'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StrengthPredictionCard } from '../src/features/weight-tracker/components/StrengthPredictionCard.js'
import { changeAppLanguage } from '../src/i18n/index.js'

const available: StrengthPredictionData = {
  status: 'AVAILABLE',
  previewStatus: 'RESEARCH_PREVIEW',
  method: 'LAST_SESSION',
  methodVersion: 'strength-next-session-v1',
  sourceType: 'EXERCISE',
  estimatedNextMaxWeightKg: 80,
  currentMaxWeightKg: 80,
  expectedChangeKg: 0,
  history: { completedSourceSessions: 7, recentCadenceDays: 5 },
  reliability: { reasonCodes: [] },
  disclaimerCode: 'EXPERIMENTAL_STRENGTH_ESTIMATE',
}

describe('strength prediction research preview', () => {
  it('renders the available estimate, history, cadence, and conservative copy', () => {
    render(
      <StrengthPredictionCard
        state={{ status: 'success', data: available, errorMessage: null }}
        onRetry={() => undefined}
      />,
    )
    expect(screen.getByText('Research Preview')).toBeVisible()
    expect(screen.getByText('Latest completed max')).toBeVisible()
    expect(screen.getByText('Estimated next-session max')).toBeVisible()
    expect(screen.getAllByText('80.0 kg')).toHaveLength(2)
    expect(screen.getByText('7')).toBeVisible()
    expect(screen.getByText(/about every 5.0 days/)).toBeVisible()
    expect(screen.getByText(/not a prescribed workout load/)).toBeVisible()
    expect(
      screen.queryByText(
        /optimal weight|guaranteed personal record|guarantees progression|machine-learning superiority/i,
      ),
    ).not.toBeInTheDocument()
    expect(window.localStorage.getItem('strengthPrediction')).toBeNull()
  })

  it('renders a reason-specific abstention without inventing a number', () => {
    render(
      <StrengthPredictionCard
        state={{
          status: 'success',
          data: {
            ...available,
            status: 'ABSTAINED',
            estimatedNextMaxWeightKg: null,
            currentMaxWeightKg: null,
            expectedChangeKg: null,
            reliability: { reasonCodes: ['INSUFFICIENT_SOURCE_HISTORY'] },
          },
          errorMessage: null,
        }}
        onRetry={() => undefined}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Log more completed sessions',
    )
    expect(screen.queryByText(/kg$/)).not.toBeInTheDocument()
  })

  it('announces service errors and retries from a keyboard-accessible button', async () => {
    const onRetry = vi.fn()
    const actor = userEvent.setup()
    render(
      <StrengthPredictionCard
        state={{
          status: 'error',
          data: null,
          errorMessage:
            'The strength estimate service is unavailable. Please try again.',
        }}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'service is unavailable',
    )
    await actor.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders professional Arabic copy under document-level RTL', async () => {
    await act(() => changeAppLanguage('ar'))
    render(
      <StrengthPredictionCard
        state={{ status: 'success', data: available, errorMessage: null }}
        onRetry={() => undefined}
      />,
    )
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getByText('نسخة تجريبية')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'تقدير القوة للجلسة القادمة' }),
    ).toBeVisible()
    expect(screen.getByText(/كل 5.0 أيام تقريبًا/)).toBeVisible()
  })
})
