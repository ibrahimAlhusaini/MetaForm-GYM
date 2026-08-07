import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { useMachines } from '../hooks/useMachines.js'
import type { useSessions } from '../hooks/useSessions.js'
import {
  EmptyState,
  WeightTrackerErrorState,
  WeightTrackerSkeleton,
} from './AsyncStates.js'
import { MachineCard } from './MachineCard.js'
import { SessionList } from './SessionList.js'

type Props = {
  title: string
  browsePath: string
  emptyTitle: string
  emptyDescription: string
} & (
  | { kind: 'machines'; resource: ReturnType<typeof useMachines> }
  | { kind: 'sessions'; resource: ReturnType<typeof useSessions> }
)

function Panel({
  title,
  browsePath,
  children,
}: {
  title: string
  browsePath: string
  children: React.ReactNode
}) {
  const { t } = useTranslation('weightTracker')
  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.015] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link
          to={browsePath}
          className="inline-flex items-center gap-1 text-sm font-semibold text-lime-300"
        >
          {t('overview.viewAll')}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
      {children}
    </section>
  )
}

export function AsyncStatePanel(props: Props) {
  const { t } = useTranslation('weightTracker')
  const { state, retry } = props.resource
  if (state.status === 'loading')
    return (
      <Panel title={props.title} browsePath={props.browsePath}>
        <WeightTrackerSkeleton
          label={t('overview.loadingPanel', {
            title: props.title.toLowerCase(),
          })}
        />
      </Panel>
    )
  if (state.status === 'error')
    return (
      <Panel title={props.title} browsePath={props.browsePath}>
        <WeightTrackerErrorState message={state.errorMessage} onRetry={retry} />
      </Panel>
    )
  if (state.data.items.length === 0)
    return (
      <Panel title={props.title} browsePath={props.browsePath}>
        <EmptyState
          title={props.emptyTitle}
          description={props.emptyDescription}
        />
      </Panel>
    )
  if (props.kind === 'machines') {
    const machineState = props.resource.state
    return (
      <Panel title={props.title} browsePath={props.browsePath}>
        <div className="grid gap-3 md:grid-cols-2">
          {machineState.status === 'success'
            ? machineState.data.items.map((machine) => (
                <MachineCard key={machine.id} machine={machine} />
              ))
            : null}
        </div>
      </Panel>
    )
  }
  const sessionState = props.resource.state
  return (
    <Panel title={props.title} browsePath={props.browsePath}>
      <SessionList
        sessions={
          sessionState.status === 'success' ? sessionState.data.items : []
        }
      />
    </Panel>
  )
}
