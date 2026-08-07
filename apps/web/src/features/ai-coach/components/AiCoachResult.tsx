import type { AiCoachSessionDetail } from '@metaform/shared-types'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Info,
  Lightbulb,
} from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppLocale } from '../../../i18n/locale.js'
import {
  formatAiCoachDate,
  formatEvidenceValue,
} from '../utils/ai-coach-formatters.js'

const insufficient = (session: AiCoachSessionDetail): boolean =>
  session.result?.findings.some(
    (finding) =>
      finding.code.includes('INSUFFICIENT') ||
      finding.code.includes('LIMITED_DATA'),
  ) === true ||
  session.result?.evidence.some(
    (item) => item.value === 'INSUFFICIENT_DATA',
  ) === true

export const AiCoachResult = forwardRef<
  HTMLElement,
  { session: AiCoachSessionDetail }
>(function AiCoachResult({ session }, ref) {
  const { t } = useTranslation('aiCoach')
  const locale = useAppLocale()
  if (!session.result)
    return (
      <section
        ref={ref}
        tabIndex={-1}
        aria-label={t('result.title')}
        className="rounded-2xl border border-white/10 bg-[#111315] p-6"
      >
        <h2 className="text-xl font-semibold">
          {t('result.unavailableTitle')}
        </h2>
        <p className="mt-2 text-zinc-400">
          {t('result.unavailableDescription')}
        </p>
      </section>
    )
  const result = session.result
  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="coach-result-headline"
      className="rounded-2xl border border-lime-300/20 bg-gradient-to-br from-lime-300/[0.07] via-[#111315] to-[#111315] p-5 outline-none focus-visible:ring-2 focus-visible:ring-lime-300 sm:p-7"
    >
      <p className="text-sm font-semibold tracking-[0.16em] text-lime-300 uppercase">
        {t('result.title')}
      </p>
      <h2
        id="coach-result-headline"
        className="mt-3 text-2xl font-semibold sm:text-3xl"
      >
        {result.headline}
      </h2>
      <p className="mt-4 max-w-3xl leading-7 text-zinc-300">{result.summary}</p>
      {insufficient(session) ? (
        <div className="mt-5 rounded-xl border border-sky-300/20 bg-sky-300/5 p-4">
          <h3 className="font-semibold">{t('insufficient.title')}</h3>
          <p className="mt-1 text-sm text-zinc-300">
            {t(`insufficient.${session.type}`)}
          </p>
        </div>
      ) : null}
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <ResultSection
          icon={Info}
          title={t('result.findings')}
          empty={t('result.noFindings')}
        >
          {result.findings.map((finding) => (
            <li
              key={`${finding.code}-${finding.text}`}
              className="rounded-xl border border-white/10 bg-black/15 p-3"
            >
              <span className="text-xs font-semibold tracking-wide text-zinc-500">
                {t(`severity.${finding.severity}`)}
              </span>
              <p className="mt-1 text-sm leading-6 text-zinc-300">
                {finding.text}
              </p>
            </li>
          ))}
        </ResultSection>
        <ResultSection
          icon={Lightbulb}
          title={t('result.recommendations')}
          empty={t('result.noRecommendations')}
        >
          {[...result.recommendations]
            .sort((a, b) => a.priority - b.priority)
            .map((recommendation) => (
              <li
                key={`${recommendation.code}-${String(recommendation.priority)}`}
                className="rounded-xl border border-white/10 bg-black/15 p-3"
              >
                <span className="text-xs font-semibold text-lime-300">
                  {t('result.priority', { priority: recommendation.priority })}
                </span>
                <h4 className="mt-1 font-semibold">{recommendation.title}</h4>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {recommendation.description}
                </p>
              </li>
            ))}
        </ResultSection>
        <ResultSection
          icon={BarChart3}
          title={t('result.evidence')}
          empty={t('result.noEvidence')}
        >
          {result.evidence.map((item, index) => (
            <li
              key={`${item.metric}-${String(index)}`}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-white/10 bg-black/15 p-3"
            >
              <span className="text-sm text-zinc-400">
                {t(`evidenceMetrics.${item.metric}`, {
                  defaultValue: item.metric,
                })}
              </span>
              <strong>{formatEvidenceValue(item, locale, t)}</strong>
            </li>
          ))}
        </ResultSection>
        <ResultSection
          icon={AlertTriangle}
          title={t('result.cautions')}
          empty={t('result.noCautions')}
        >
          {result.cautions.map((caution) => (
            <li
              key={caution}
              className="rounded-xl border border-amber-200/15 bg-amber-200/[0.04] p-3 text-sm leading-6 text-zinc-300"
            >
              {caution}
            </li>
          ))}
        </ResultSection>
      </div>
      <footer className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-zinc-500">
        <span>
          {t('result.generatedAt', {
            date: formatAiCoachDate(
              session.completedAt ?? session.startedAt,
              locale,
            ),
          })}
        </span>
        <span>
          {t('result.version', { version: session.metadata.coachVersion })}
        </span>
      </footer>
    </section>
  )
})

function ResultSection({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: typeof CheckCircle2
  title: string
  empty: string
  children: ReactNode
}) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <section>
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-lime-300" aria-hidden="true" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">{children}</ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">{empty}</p>
      )}
    </section>
  )
}
