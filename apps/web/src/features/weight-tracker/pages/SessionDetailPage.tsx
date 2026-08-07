import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { ConfirmationDialog } from '../components/ConfirmationDialog.js'
import { SessionLogCard } from '../components/SessionLogCard.js'
import { SessionDetailHeader } from '../components/SessionDetailHeader.js'
import { SessionMetadataCard } from '../components/SessionMetadataCard.js'
import {
  EmptyState,
  WeightTrackerErrorState,
  WeightTrackerSkeleton,
} from '../components/AsyncStates.js'
import { useMachines } from '../hooks/useMachines.js'
import { useSessionDetail } from '../hooks/useSessionDetail.js'
import {
  completeSession,
  createLog,
  createSet,
  deleteLog,
  deleteSession,
  deleteSet,
  reorderLogs,
  reorderSets,
  updateLog,
  updateSession,
  updateSet,
} from '../services/weight-tracker.service.js'
import type { ExerciseLog } from '../types/weight-tracker.types.js'
import { weightTrackerErrorMessage } from '../utils/error-message.js'

const moved = <T,>(items: T[], index: number, direction: -1 | 1): T[] => {
  const next = [...items]
  const [item] = next.splice(index, 1)
  if (item !== undefined) next.splice(index + direction, 0, item)
  return next
}
export function SessionDetailPage() {
  const { t } = useTranslation('weightTracker')
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const detail = useSessionDetail(sessionId)
  const machineQuery = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    }),
    [],
  )
  const machines = useMachines(machineQuery)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'complete' | 'delete' | null>(null)
  const [addingLog, setAddingLog] = useState(false)
  const [machineId, setMachineId] = useState('')
  const [editingMeta, setEditingMeta] = useState(false)
  const mutate = async (operation: () => Promise<unknown>) => {
    setPending(true)
    setError(null)
    try {
      await operation()
      detail.retry()
    } catch (reason) {
      setError(weightTrackerErrorMessage(reason, t('errors.updateWorkout')))
    } finally {
      setPending(false)
    }
  }
  if (detail.state.status === 'loading')
    return <WeightTrackerSkeleton label={t('loading.workout')} />
  if (detail.state.status === 'error')
    return (
      <WeightTrackerErrorState
        message={detail.state.errorMessage}
        onRetry={detail.retry}
      />
    )
  const session = detail.state.data
  const moveLog = async (index: number, direction: -1 | 1) =>
    mutate(() =>
      reorderLogs(
        session.id,
        moved(session.exerciseLogs, index, direction).map(
          (log, orderIndex) => ({ logId: log.id, orderIndex }),
        ),
      ),
    )
  const moveSet = async (log: ExerciseLog, index: number, direction: -1 | 1) =>
    mutate(() =>
      reorderSets(
        log.id,
        moved(log.sets, index, direction).map((set, setIndex) => ({
          setId: set.id,
          setNumber: setIndex + 1,
        })),
      ),
    )
  return (
    <div>
      <SessionDetailHeader
        completedAt={session.completedAt}
        onComplete={() => {
          setConfirm('complete')
        }}
        onDelete={() => {
          setConfirm('delete')
        }}
      />
      <SessionMetadataCard
        session={session}
        editing={editingMeta}
        onEditingChange={setEditingMeta}
        onSave={(startedAt, notes) =>
          mutate(() => updateSession(session.id, { startedAt, notes }))
        }
      />
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-red-200"
        >
          {error}
        </p>
      ) : null}
      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('detail.exercises')}</h2>
          {!session.completedAt ? (
            <button
              type="button"
              onClick={() => {
                setAddingLog(true)
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-lime-300/20 px-3 font-semibold text-lime-300"
            >
              <Plus className="size-4" />
              {t('detail.addMachine')}
            </button>
          ) : null}
        </div>
        {addingLog ? (
          <div className="mt-4 flex flex-wrap gap-3 rounded-xl border border-lime-300/20 p-4">
            <select
              aria-label={t('detail.machineToAdd')}
              value={machineId}
              onChange={(e) => {
                setMachineId(e.target.value)
              }}
              className="min-h-11 min-w-60 flex-1 rounded-xl border border-white/10 bg-[#151719] px-3"
            >
              <option value="">{t('detail.chooseMachine')}</option>
              {machines.state.status === 'success'
                ? machines.state.data.items.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))
                : null}
            </select>
            <button
              type="button"
              disabled={!machineId || pending}
              onClick={() =>
                void mutate(() =>
                  createLog(session.id, {
                    exerciseId: null,
                    customMachineId: machineId,
                    notes: null,
                    orderIndex: session.exerciseLogs.length,
                  }),
                ).then(() => {
                  setAddingLog(false)
                  setMachineId('')
                })
              }
              className="rounded-xl bg-lime-300 px-4 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {t('detail.addEntry')}
            </button>
          </div>
        ) : null}
        <div className="mt-4 space-y-4">
          {session.exerciseLogs.length === 0 ? (
            <EmptyState
              title={t('detail.emptyTitle')}
              description={t('detail.emptyDescription')}
            />
          ) : (
            session.exerciseLogs.map((log, index) => (
              <SessionLogCard
                key={log.id}
                log={log}
                index={index}
                total={session.exerciseLogs.length}
                pending={pending}
                onMove={(direction) => moveLog(index, direction)}
                onDelete={() => mutate(() => deleteLog(log.id))}
                onNotes={(notes) => mutate(() => updateLog(log.id, { notes }))}
                onAddSet={(input) => mutate(() => createSet(log.id, input))}
                onUpdateSet={(setId, input) =>
                  mutate(() => updateSet(setId, input))
                }
                onDeleteSet={(setId) => mutate(() => deleteSet(setId))}
                onMoveSet={(setIndex, direction) =>
                  moveSet(log, setIndex, direction)
                }
              />
            ))
          )}
        </div>
      </section>
      {session.completedAt ? (
        <p className="mt-6 rounded-xl border border-lime-300/15 bg-lime-300/5 p-4 text-sm text-zinc-300">
          {t('detail.analyticsNote')}
        </p>
      ) : null}
      <ConfirmationDialog
        open={confirm === 'complete'}
        title={t('detail.completeTitle')}
        description={t('detail.completeDescription')}
        confirmLabel={t('detail.complete')}
        destructive={false}
        pending={pending}
        onClose={() => {
          setConfirm(null)
        }}
        onConfirm={() =>
          void mutate(() => completeSession(session.id)).then(() => {
            setConfirm(null)
          })
        }
      />
      <ConfirmationDialog
        open={confirm === 'delete'}
        title={t('detail.deleteTitle')}
        description={t('detail.deleteDescription')}
        confirmLabel={t('detail.confirmDelete')}
        pending={pending}
        onClose={() => {
          setConfirm(null)
        }}
        onConfirm={() =>
          void deleteSession(session.id)
            .then(() => navigate('/app/weights/sessions'))
            .catch((reason: unknown) => {
              setError(
                weightTrackerErrorMessage(reason, t('errors.deleteWorkout')),
              )
            })
        }
      />
    </div>
  )
}
