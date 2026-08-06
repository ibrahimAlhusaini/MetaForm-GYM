import { Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
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
  const { machineId } = useParams()
  const editing = Boolean(machineId)
  const navigate = useNavigate()
  const load = useCallback(
    () => (machineId ? fetchMachine(machineId) : Promise.resolve(null)),
    [machineId],
  )
  const resource = useAsyncResource(
    load,
    'We could not load this machine. Please try again.',
  )
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
      setError(
        weightTrackerErrorMessage(
          reason,
          'We could not save this machine. Please try again.',
        ),
      )
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
          ? 'This machine is used in workout history and cannot be deleted. Delete the related workout only if you truly intend to remove that history.'
          : weightTrackerErrorMessage(
              reason,
              'We could not delete this machine.',
            ),
      )
    } finally {
      setPending(false)
    }
  }
  if (editing && resource.state.status === 'loading')
    return <WeightTrackerSkeleton label="Loading machine" />
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
            Back to machines
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">
            {editing ? 'Edit machine' : 'Add machine'}
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
            Delete machine
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
        submitLabel={editing ? 'Save changes' : 'Create machine'}
        pending={pending}
        errorMessage={error}
        onSubmit={submit}
      />
      <ConfirmationDialog
        open={confirming}
        title="Delete this machine?"
        description="This is only allowed when no workout history references the machine."
        confirmLabel="Delete machine"
        pending={pending}
        onConfirm={() => void remove()}
        onClose={() => {
          setConfirming(false)
        }}
      />
    </div>
  )
}
