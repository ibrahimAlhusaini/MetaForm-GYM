import type { DashboardSummaryData } from '@metaform/shared-types'
import { BodyWeightChart } from './components/BodyWeightChart.js'
import { DashboardErrorState } from './components/DashboardErrorState.js'
import { DashboardHeader } from './components/DashboardHeader.js'
import { DashboardSkeleton } from './components/DashboardSkeleton.js'
import { OverviewGrid } from './components/OverviewGrid.js'
import { StrengthProgressSection } from './components/StrengthProgressSection.js'
import { useDashboardSummary } from './hooks/useDashboardSummary.js'

function DashboardContent({ data }: { data: DashboardSummaryData }) {
  return (
    <div>
      <DashboardHeader
        firstName={data.user.firstName}
        generatedAt={data.meta.generatedAt}
      />
      <OverviewGrid overview={data.overview} />
      <BodyWeightChart progress={data.bodyWeightProgress} />
      <StrengthProgressSection machines={data.strengthProgress.machines} />
    </div>
  )
}

export function DashboardPage() {
  const { state, retry } = useDashboardSummary()

  if (state.status === 'loading') {
    return <DashboardSkeleton />
  }

  if (state.status === 'error') {
    return <DashboardErrorState message={state.errorMessage} onRetry={retry} />
  }

  return <DashboardContent data={state.data} />
}
