import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { AiCoachResult } from '../components/AiCoachResult.js'
import { AiCoachError, AiCoachLoading } from '../components/AiCoachStates.js'
import { useAiCoachSession } from '../hooks/useAiCoachSession.js'

export function AiCoachSessionPage() {
  const { sessionId = '' } = useParams()
  const { t } = useTranslation('aiCoach')
  const session = useAiCoachSession(sessionId)
  return (
    <div>
      <Link
        to="/app/ai-coach"
        className="inline-flex min-h-11 items-center gap-2 font-semibold text-lime-300 focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t('detail.back')}
      </Link>
      <header className="mt-5">
        <h1 className="text-3xl font-semibold">{t('detail.title')}</h1>
        <p className="mt-2 text-zinc-400">{t('detail.description')}</p>
      </header>
      <div className="mt-7">
        {session.state.status === 'loading' ? (
          <AiCoachLoading label={t('detail.loading')} />
        ) : null}
        {session.state.status === 'error' ? (
          <AiCoachError
            message={session.state.errorMessage}
            onRetry={session.retry}
          />
        ) : null}
        {session.state.status === 'success' ? (
          <AiCoachResult session={session.state.data} />
        ) : null}
      </div>
    </div>
  )
}
