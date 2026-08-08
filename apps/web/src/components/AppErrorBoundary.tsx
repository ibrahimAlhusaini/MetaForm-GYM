import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface BoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface BoundaryState {
  failed: boolean
}

class RenderErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  override componentDidCatch(): void {
    // The fallback intentionally does not expose render details to the UI.
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function SafeErrorFallback() {
  const { t } = useTranslation('common')
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090a0b] p-4 text-zinc-50">
      <section
        role="alert"
        aria-labelledby="application-error-title"
        className="w-full max-w-lg rounded-2xl border border-amber-300/20 bg-[#111315] p-6 text-center sm:p-8"
      >
        <AlertTriangle
          className="mx-auto size-9 text-amber-300"
          aria-hidden="true"
        />
        <h1
          id="application-error-title"
          className="mt-4 text-2xl font-semibold"
        >
          {t('states.applicationErrorTitle')}
        </h1>
        <p className="mt-3 leading-7 text-zinc-400">
          {t('states.applicationErrorDescription')}
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.reload()
          }}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {t('actions.reload')}
        </button>
      </section>
    </main>
  )
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <RenderErrorBoundary fallback={<SafeErrorFallback />}>
      {children}
    </RenderErrorBoundary>
  )
}
