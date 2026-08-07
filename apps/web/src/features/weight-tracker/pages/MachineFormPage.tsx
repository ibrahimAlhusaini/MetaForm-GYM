import { Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmationDialog } from '../components/ConfirmationDialog.js'
import { MachineForm } from '../components/MachineForm.js'
import {
  WeightTrackerErrorState,
  WeightTrackerSkeleton,
} from '../components/AsyncStates.js'
import {
  createMachine,
  deleteMachine,
  fetchMachine,
  updateMachine,
} from '../services/weight-tracker.service.js'
import {
  isMachineHistoryConflict,
  weightTrackerErrorMessage,
} from '../utils/error-message.js'
import { machinePayload } from '../utils/payload-transformers.js'
import type { MachineFormValues } from '../validation/weight-tracker.schemas.js'
import { useAsyncResource } from '../hooks/useAsyncResource.js'

export function MachineFormPage() {
  const { t } = useTranslation('weightTracker')
  const { machineId } = useParams()
  const editing = Boolean(machineId)
  const navigate = useNavigate()
  const load = useCallback(
    () => (machineId ? fetchMachine(machineId) : Promise.resolve(null)),
    [machineId],
  )
  const resource = useAsyncResource(load, t('errors.machine'))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const submit = async (values: MachineFormValues) => {
    setPending(true)
    setError(null)
    try {
      const machine =
        editing && machineId
          ? await updateMachine(machineId, machinePayload(values))
          : await createMachine(machinePayload(values))
      void navigate(`/app/weights/machines/${machine.id}`, { replace: true })
    } catch (reason) {
      setError(weightTrackerErrorMessage(reason, t('errors.saveMachine')))
    } finally {
      setPending(false)
    }
  }
  const remove = async () => {
    if (!machineId) return
    setPending(true)
    try {
      await deleteMachine(machineId)
      void navigate('/app/weights/machines')
    } catch (reason) {
      setConfirming(false)
      setError(
        isMachineHistoryConflict(reason)
          ? t('errors.machineConflict')
          : weightTrackerErrorMessage(reason, t('errors.deleteMachine')),
      )
    } finally {
      setPending(false)
    }
  }
  if (editing && resource.state.status === 'loading')
    return <WeightTrackerSkeleton label={t('loading.machine')} />
  if (editing && resource.state.status === 'error')
    return (
      <WeightTrackerErrorState
        message={resource.state.errorMessage}
        onRetry={resource.retry}
      />
    )
  const machine =
    resource.state.status === 'success' ? resource.state.data : null
  return (
    <div>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/app/weights/machines" className="text-sm text-lime-300">
            {t('machines.back')}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">
            {editing ? t('machines.editTitle') : t('machines.addTitle')}
          </h1>
        </div>
        {machine ? (
          <button
            type="button"
            onClick={() => {
              setConfirming(true)
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-400/20 px-4 font-semibold text-red-300"
          >
            <Trash2 className="size-4" />
            {t('machines.delete')}
          </button>
        ) : null}
      </header>
      <MachineForm
        key={machine?.updatedAt ?? 'new'}
        {...(machine
          ? {
              defaultValues: {
                name: machine.name,
                imageUrl: machine.imageUrl ?? '',
                targetMuscle: machine.targetMuscle,
                description: machine.description ?? '',
              },
            }
          : {})}
        submitLabel={editing ? t('machines.saveChanges') : t('machines.create')}
        pending={pending}
        errorMessage={error}
        onSubmit={submit}
      />
      <ConfirmationDialog
        open={confirming}
        title={t('machines.deleteTitle')}
        description={t('machines.deleteDescription')}
        confirmLabel={t('machines.delete')}
        pending={pending}
        onConfirm={() => void remove()}
        onClose={() => {
          setConfirming(false)
        }}
      />
    </div>
  )
}
