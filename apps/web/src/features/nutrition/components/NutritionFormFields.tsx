import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'

const fieldClass =
  'mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 outline-none focus:border-lime-300 focus:ring-2 focus:ring-lime-300/15'

export function FormField({
  label,
  unit,
  source,
  error,
  registration,
  inputMode,
}: {
  label: string
  unit: string
  source: string
  error: FieldError | undefined
  registration: UseFormRegisterReturn
  inputMode: 'numeric' | 'decimal'
}) {
  return (
    <label className="text-sm font-medium">
      <FieldLabel label={label} unit={unit} source={source} />
      <input
        {...registration}
        inputMode={inputMode}
        dir="ltr"
        aria-invalid={Boolean(error)}
        className={fieldClass}
      />
      <FieldErrorText error={error} />
    </label>
  )
}

export function SelectField({
  label,
  source,
  error,
  registration,
  options,
  placeholder,
}: {
  label: string
  source: string
  error: FieldError | undefined
  registration: UseFormRegisterReturn
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <label className="text-sm font-medium">
      <FieldLabel label={label} source={source} />
      <select
        {...registration}
        aria-invalid={Boolean(error)}
        className={fieldClass}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldErrorText error={error} />
    </label>
  )
}

function FieldLabel({
  label,
  unit,
  source,
}: {
  label: string
  unit?: string
  source: string
}) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span>
        {label}
        {unit ? ` (${unit})` : ''}
      </span>
      <span className="text-xs font-normal text-zinc-500">{source}</span>
    </span>
  )
}

function FieldErrorText({ error }: { error: FieldError | undefined }) {
  return error ? (
    <span role="alert" className="mt-1.5 block text-xs leading-5 text-red-300">
      {error.message}
    </span>
  ) : null
}
