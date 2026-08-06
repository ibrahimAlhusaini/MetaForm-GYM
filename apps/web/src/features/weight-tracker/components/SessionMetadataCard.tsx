import type { SessionDetail } from '../types/weight-tracker.types.js'
import {
  formatDateTime,
  formatDuration,
  formatVolume,
  toDateTimeLocal,
} from '../utils/formatters.js'

interface Props {
  session: SessionDetail
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onSave: (startedAt: string, notes: string | null) => Promise<void>
}

export function SessionMetadataCard({
  session,
  editing,
  onEditingChange,
  onSave,
}: Props) {
  return (
    <section className="mt-6 rounded-2xl border border-white/8 bg-[#111315] p-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="Started" value={formatDateTime(session.startedAt)} />
        <Metric label="Completed" value={formatDateTime(session.completedAt)} />
        <Metric
          label="Duration"
          value={formatDuration(session.durationMinutes)}
        />
        <Metric label="Volume" value={formatVolume(session.totalVolumeKg)} />
      </div>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            const startedValue = form.get('startedAt')
            const notesValue = form.get('notes')
            if (
              typeof startedValue !== 'string' ||
              typeof notesValue !== 'string'
            )
              return
            const startedAt = new Date(startedValue).toISOString()
            const notes = notesValue.trim() || null
            void onSave(startedAt, notes).then(() => {
              onEditingChange(false)
            })
          }}
          className="mt-5 grid gap-3 sm:grid-cols-[14rem_1fr_auto]"
        >
          <input
            name="startedAt"
            aria-label="Workout start time"
            type="datetime-local"
            defaultValue={toDateTimeLocal(session.startedAt)}
            className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
          />
          <input
            name="notes"
            aria-label="Workout notes"
            defaultValue={session.notes ?? ''}
            className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
          />
          <button className="rounded-xl bg-lime-300 px-4 font-semibold text-zinc-950">
            Save details
          </button>
        </form>
      ) : (
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/8 pt-4">
          <p className="text-zinc-400">{session.notes ?? 'No workout notes'}</p>
          <button
            type="button"
            onClick={() => {
              onEditingChange(true)
            }}
            className="text-sm font-semibold text-lime-300"
          >
            Edit details
          </button>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 uppercase">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
