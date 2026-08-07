import type {
  AiCoachCapabilityType,
  AiCoachSessionDetail,
} from '@metaform/shared-types'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AiCoachCapabilityGrid } from '../components/AiCoachCapabilityGrid.js'
import { AiCoachHistory } from '../components/AiCoachHistory.js'
import { AiCoachResult } from '../components/AiCoachResult.js'
import { AiCoachSelectionPanel } from '../components/AiCoachSelectionPanel.js'
import { AiCoachError, AiCoachLoading } from '../components/AiCoachStates.js'
import { useAiCoachCapabilities } from '../hooks/useAiCoachCapabilities.js'
import { useAiCoachGeneration } from '../hooks/useAiCoachGeneration.js'
import type { AiCoachSelectionState } from '../types/ai-coach.types.js'
import { buildAiCoachRequest } from '../utils/ai-coach-payload.js'

export function AiCoachPage() {
  const { t, i18n } = useTranslation('aiCoach')
  const capabilities = useAiCoachCapabilities()
  const generation = useAiCoachGeneration()
  const [selectedType, setSelectedType] =
    useState<AiCoachCapabilityType | null>(null)
  const [selection, setSelection] = useState<AiCoachSelectionState>(null)
  const [validationError, setValidationError] = useState(false)
  const [result, setResult] = useState<AiCoachSessionDetail | null>(null)
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const resultRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (result) resultRef.current?.focus()
  }, [result])
  const selectCapability = (type: AiCoachCapabilityType) => {
    setSelectedType(type)
    setSelection(null)
    setValidationError(false)
    generation.clearError()
  }
  const generate = async () => {
    if (!selectedType) return
    const language = (i18n.resolvedLanguage ?? i18n.language).startsWith('ar')
      ? 'ar'
      : 'en'
    const request = buildAiCoachRequest(selectedType, language, selection)
    if (!request) {
      setValidationError(true)
      return
    }
    setValidationError(false)
    const session = await generation.submit(request)
    if (session) {
      setResult(session)
      setHistoryRefresh((value) => value + 1)
    }
  }
  return (
    <div>
      <header>
        <p className="text-sm font-semibold tracking-[0.18em] text-lime-300 uppercase">
          {t('header.eyebrow')}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('header.title')}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-400">
          {t('header.description')}
        </p>
      </header>
      <section aria-labelledby="capability-heading" className="mt-8">
        <h2 id="capability-heading" className="text-2xl font-semibold">
          {t('capabilities.heading')}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {t('capabilities.description')}
        </p>
        <div className="mt-5">
          {capabilities.state.status === 'loading' ? (
            <AiCoachLoading label={t('capabilities.loading')} />
          ) : null}
          {capabilities.state.status === 'error' ? (
            <AiCoachError
              message={capabilities.state.errorMessage}
              onRetry={capabilities.retry}
            />
          ) : null}
          {capabilities.state.status === 'success' ? (
            <AiCoachCapabilityGrid
              capabilities={capabilities.state.data}
              selected={selectedType}
              onSelect={selectCapability}
            />
          ) : null}
        </div>
      </section>
      {selectedType ? (
        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(20rem,0.65fr)_minmax(0,1.35fr)]">
          <AiCoachSelectionPanel
            type={selectedType}
            selection={selection}
            pending={generation.pending}
            error={generation.error}
            validationError={validationError}
            onSelectionChange={(value) => {
              setSelection(value)
              setValidationError(false)
            }}
            onGenerate={() => {
              void generate()
            }}
          />
          <div>
            {generation.pending ? (
              <div
                className="rounded-2xl border border-lime-300/20 bg-lime-300/[0.04] p-8 text-center"
                role="status"
              >
                <p className="font-semibold text-lime-200">
                  {t('generation.analyzing')}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  {t('generation.wait')}
                </p>
              </div>
            ) : null}
            {result && !generation.pending ? (
              <AiCoachResult ref={resultRef} session={result} />
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mt-8 flex gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-zinc-400">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-lime-300"
          aria-hidden="true"
        />
        <p>{t('guidanceNote')}</p>
      </div>
      <AiCoachHistory key={historyRefresh} />
    </div>
  )
}
