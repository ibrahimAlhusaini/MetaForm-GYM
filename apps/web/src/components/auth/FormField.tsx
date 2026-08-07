import type { HTMLInputTypeAttribute } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface FormFieldProps {
  id: string
  label: string
  type: HTMLInputTypeAttribute
  autoComplete: string
  placeholder: string
  registration: UseFormRegisterReturn
  error: string | undefined
}

export function FormField({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  registration,
  error,
}: FormFieldProps) {
  const errorId = `${id}-error`

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-200"
      >
        {label}
      </label>
      <input
        {...registration}
        id={id}
        type={type}
        dir={type === 'email' || type === 'url' ? 'ltr' : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-12 w-full rounded-xl border border-white/10 bg-[#151719] px-4 text-[0.95rem] text-white transition outline-none placeholder:text-zinc-600 hover:border-white/20 focus:border-lime-300 focus:ring-3 focus:ring-lime-300/12"
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}
