import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BodyWeightForecastCard } from '../components/BodyWeightForecastCard.js'
import { BodyWeightHistory } from '../components/BodyWeightHistory.js'
import { BodyWeightMeasurementForm } from '../components/BodyWeightMeasurementForm.js'
import { useBodyWeightPage } from '../hooks/useBodyWeightPage.js'

export function BodyWeightPage() {
  const { t } = useTranslation('bodyWeight')
  const page = useBodyWeightPage()
  const prediction =
    page.prediction.status === 'success' ? page.prediction.data : null
  return (
    <div>
      <Link
        to="/app/weights"
        className="inline-flex items-center gap-2 text-sm font-semibold text-lime-300"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t('header.back')}
      </Link>
      <header className="mt-6">
        <p className="text-sm font-semibold tracking-[.18em] text-lime-300 uppercase">
          {t('header.eyebrow')}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('header.title')}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-400">
          {t('header.description')}
        </p>
      </header>
      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        <div className="grid gap-6">
          <BodyWeightMeasurementForm
            saving={page.saving}
            serviceError={page.saveError}
            onSave={page.save}
          />
          <BodyWeightForecastCard
            state={page.prediction}
            onRetry={() => {
              void page.retryPrediction()
            }}
          />
        </div>
        <BodyWeightHistory
          state={page.history}
          prediction={prediction}
          onRetry={() => {
            void page.retryHistory()
          }}
        />
      </div>
    </div>
  )
}
