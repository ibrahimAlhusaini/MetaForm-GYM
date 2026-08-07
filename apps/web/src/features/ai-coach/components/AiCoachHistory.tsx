import type { AiCoachCapabilityType } from '@metaform/shared-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AI_COACH_HISTORY_LIMIT,
  supportedCapabilityTypes,
} from '../constants/ai-coach.constants.js'
import { useAiCoachHistory } from '../hooks/useAiCoachHistory.js'
import { capabilityLabel } from '../utils/ai-coach-formatters.js'
import { AiCoachEmpty, AiCoachError, AiCoachLoading } from './AiCoachStates.js'
import { AiCoachHistoryItem } from './AiCoachHistoryItem.js'

export function AiCoachHistory() {
  const { t } = useTranslation(['aiCoach', 'common'])
  const [page, setPage] = useState(1)
  const [type, setType] = useState<AiCoachCapabilityType | undefined>()
  const history = useAiCoachHistory({
    page,
    limit: AI_COACH_HISTORY_LIMIT,
    sortOrder: 'desc',
    ...(type ? { type } : {}),
  })
  const changeType = (value: string) => {
    setType(
      value
        ? supportedCapabilityTypes.find((item) => item === value)
        : undefined,
    )
    setPage(1)
  }
  return (
    <section aria-labelledby="coach-history-title" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="coach-history-title" className="text-2xl font-semibold">
            {t('aiCoach:history.title')}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {t('aiCoach:history.description')}
          </p>
        </div>
        <label className="text-sm font-medium">
          {t('aiCoach:history.filter')}
          <select
            value={type ?? ''}
            onChange={(event) => {
              changeType(event.target.value)
            }}
            className="ms-2 min-h-11 rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="">{t('aiCoach:history.allTypes')}</option>
            {supportedCapabilityTypes.map((item) => (
              <option key={item} value={item}>
                {capabilityLabel(t, item)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5">
        {history.state.status === 'loading' ? (
          <AiCoachLoading label={t('aiCoach:history.loading')} />
        ) : null}
        {history.state.status === 'error' ? (
          <AiCoachError
            message={history.state.errorMessage}
            onRetry={history.retry}
          />
        ) : null}
        {history.state.status === 'success' &&
        history.state.data.items.length === 0 ? (
          <AiCoachEmpty
            title={t('aiCoach:history.empty')}
            description={t('aiCoach:history.emptyDescription')}
          />
        ) : null}
        {history.state.status === 'success' &&
        history.state.data.items.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {history.state.data.items.map((session) => (
              <AiCoachHistoryItem key={session.id} session={session} />
            ))}
          </div>
        ) : null}
      </div>
      {history.state.status === 'success' &&
      history.state.data.pagination.totalPages > 1 ? (
        <nav
          aria-label={t('aiCoach:history.pagination')}
          className="mt-5 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            disabled={!history.state.data.pagination.hasPreviousPage}
            onClick={() => {
              setPage((value) => Math.max(1, value - 1))
            }}
            className="min-h-11 rounded-xl border border-white/10 px-4 disabled:opacity-40"
          >
            {t('common:actions.previous')}
          </button>
          <span className="text-sm text-zinc-400">
            {t('common:states.pageOf', {
              page,
              totalPages: history.state.data.pagination.totalPages,
            })}
          </span>
          <button
            type="button"
            disabled={!history.state.data.pagination.hasNextPage}
            onClick={() => {
              setPage((value) => value + 1)
            }}
            className="min-h-11 rounded-xl border border-white/10 px-4 disabled:opacity-40"
          >
            {t('common:actions.next')}
          </button>
        </nav>
      ) : null}
    </section>
  )
}
