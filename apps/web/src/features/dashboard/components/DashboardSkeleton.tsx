const overviewSkeletons = [
  'weight',
  'calories',
  'streak',
  'workouts',
  'last',
  'weekly',
]
const strengthSkeletons = ['strength-primary', 'strength-secondary']

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-lg bg-white/6 ${className}`} />
)

export function DashboardSkeleton() {
  const { t } = useTranslation('dashboard')
  return (
    <div aria-label={t('loading')} aria-busy="true">
      <span className="sr-only">{t('loading')}</span>
      <div className="border-b border-white/8 pb-8">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="mt-5 h-10 w-full max-w-sm" />
        <SkeletonBlock className="mt-4 h-4 w-full max-w-xl" />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {overviewSkeletons.map((item) => (
          <div
            key={item}
            className="h-40 rounded-2xl border border-white/8 bg-[#111315] p-5"
          >
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-7 h-8 w-32" />
            <SkeletonBlock className="mt-4 h-3 w-4/5" />
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/8 bg-[#111315] p-6">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonBlock className="mt-7 h-72 w-full" />
      </div>

      <div className="mt-10 grid gap-5 xl:grid-cols-2">
        {strengthSkeletons.map((item) => (
          <div
            key={item}
            className="h-80 rounded-2xl border border-white/8 bg-[#111315] p-5"
          >
            <SkeletonBlock className="h-14 w-3/5" />
            <SkeletonBlock className="mt-7 h-24 w-full" />
            <SkeletonBlock className="mt-7 h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
import { useTranslation } from 'react-i18next'
