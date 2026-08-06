import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { ExerciseLog, SetInput } from '../types/weight-tracker.types.js'
import { SetMutationForm } from './SetMutationForm.js'
import { ConfirmationDialog } from './ConfirmationDialog.js'
import { RecordedSetRow } from './RecordedSetRow.js'

interface Props {
  log: ExerciseLog
  index: number
  total: number
  pending: boolean
  onMove: (direction: -1 | 1) => Promise<void>
  onDelete: () => Promise<void>
  onNotes: (notes: string | null) => Promise<void>
  onAddSet: (input: SetInput) => Promise<void>
  onUpdateSet: (setId: string, input: SetInput) => Promise<void>
  onDeleteSet: (setId: string) => Promise<void>
  onMoveSet: (index: number, direction: -1 | 1) => Promise<void>
}

export function SessionLogCard(props: Props) {
  const { log } = props
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(log.notes ?? '')
  const [addingSet, setAddingSet] = useState(false)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<
    { kind: 'log' } | { kind: 'set'; setId: string; setNumber: number } | null
  >(null)
  const confirmDeletion = async () => {
    if (!confirmation) return
    if (confirmation.kind === 'log') await props.onDelete()
    else await props.onDeleteSet(confirmation.setId)
    setConfirmation(null)
  }
  return (
    <article className="rounded-2xl border border-white/8 bg-[#111315] p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{log.source.name}</h2>
            <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-zinc-400">
              {log.source.type === 'machine' ? 'Custom machine' : 'Exercise'}
            </span>
          </div>
          {editingNotes ? (
            <div className="mt-3 flex gap-2">
              <input
                aria-label={`Notes for ${log.source.name}`}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                }}
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3"
              />
              <button
                type="button"
                onClick={() =>
                  void props.onNotes(notes.trim() || null).then(() => {
                    setEditingNotes(false)
                  })
                }
                className="rounded-lg bg-lime-300 px-3 font-semibold text-zinc-950"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              {log.notes ?? 'No exercise notes'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`Edit notes for ${log.source.name}`}
            onClick={() => {
              setEditingNotes(true)
            }}
            className="rounded-lg border border-white/10 p-2"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${log.source.name} up`}
            disabled={props.index === 0 || props.pending}
            onClick={() => void props.onMove(-1)}
            className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${log.source.name} down`}
            disabled={props.index === props.total - 1 || props.pending}
            onClick={() => void props.onMove(1)}
            className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${log.source.name}`}
            disabled={props.pending}
            onClick={() => {
              setConfirmation({ kind: 'log' })
            }}
            className="rounded-lg border border-red-400/20 p-2 text-red-300"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {log.sets.map((set, setIndex) =>
          editingSetId === set.id ? (
            <SetMutationForm
              key={set.id}
              set={set}
              nextNumber={set.setNumber}
              pending={props.pending}
              onCancel={() => {
                setEditingSetId(null)
              }}
              onSave={async (input) => {
                await props.onUpdateSet(set.id, input)
                setEditingSetId(null)
              }}
            />
          ) : (
            <RecordedSetRow
              key={set.id}
              set={set}
              index={setIndex}
              total={log.sets.length}
              pending={props.pending}
              onEdit={() => {
                setEditingSetId(set.id)
              }}
              onMove={(direction) => void props.onMoveSet(setIndex, direction)}
              onDelete={() => {
                setConfirmation({
                  kind: 'set',
                  setId: set.id,
                  setNumber: set.setNumber,
                })
              }}
            />
          ),
        )}
      </div>
      {addingSet ? (
        <div className="mt-3">
          <SetMutationForm
            nextNumber={log.sets.length + 1}
            pending={props.pending}
            onCancel={() => {
              setAddingSet(false)
            }}
            onSave={async (input) => {
              await props.onAddSet(input)
              setAddingSet(false)
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAddingSet(true)
          }}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-lime-300/20 px-3 text-sm font-semibold text-lime-300"
        >
          <Plus className="size-4" />
          Add set
        </button>
      )}
      <Link
        to={`/app/weights/history/${log.source.type}/${log.source.id}`}
        className="mt-4 ml-3 inline-block text-sm font-semibold text-zinc-400 hover:text-lime-300"
      >
        View history
      </Link>
      <ConfirmationDialog
        open={confirmation !== null}
        title={
          confirmation?.kind === 'set'
            ? `Delete set ${String(confirmation.setNumber)}?`
            : `Delete ${log.source.name}?`
        }
        description={
          confirmation?.kind === 'set'
            ? 'This permanently removes the recorded set from this workout.'
            : 'This permanently removes this exercise entry and all of its recorded sets.'
        }
        confirmLabel={
          confirmation?.kind === 'set' ? 'Delete set' : 'Delete entry'
        }
        pending={props.pending}
        onClose={() => {
          setConfirmation(null)
        }}
        onConfirm={() => void confirmDeletion()}
      />
    </article>
  )
}
