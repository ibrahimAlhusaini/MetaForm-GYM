import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from '../src/components/AppErrorBoundary.js'
import { RouteLoadingFallback } from '../src/components/RouteLoadingFallback.js'
import { changeAppLanguage } from '../src/i18n/index.js'

function BrokenRoute(): never {
  throw new Error('sensitive component details')
}

describe('production UI hardening', () => {
  it('renders an accessible localized route-loading fallback', async () => {
    await act(() => changeAppLanguage('ar'))
    render(<RouteLoadingFallback />)

    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('جارٍ تحميل هذه الصفحة…')).toBeVisible()
  })

  it('contains render failures without exposing technical details', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(function suppressExpectedBoundaryError() {
        return undefined
      })
    render(
      <AppErrorBoundary>
        <BrokenRoute />
      </AppErrorBoundary>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'The application could not continue',
      }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Reload application' }),
    ).toBeEnabled()
    expect(
      screen.queryByText(/sensitive component details/i),
    ).not.toBeInTheDocument()
    consoleError.mockRestore()
  })
})
