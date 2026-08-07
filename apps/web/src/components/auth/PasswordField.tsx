import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface PasswordFieldProps {
  id: string
  label: string
  autoComplete: string
  placeholder: string
  registration: UseFormRegisterReturn
  error: string | undefined
}

export function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  registration,
  error,
}: PasswordFieldProps) {
  const { t } = useTranslation('auth')
  const [isVisible, setIsVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-200"
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...registration}
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          dir="ltr"
          className="h-12 w-full rounded-xl border border-white/10 bg-[#151719] ps-4 pe-12 text-[0.95rem] text-white transition outline-none placeholder:text-zinc-600 hover:border-white/20 focus:border-lime-300 focus:ring-3 focus:ring-lime-300/12"
        />
        <button
          type="button"
          onClick={() => {
            setIsVisible((visible) => !visible)
          }}
          aria-label={t(isVisible ? 'password.hide' : 'password.show', {
            label,
          })}
          aria-pressed={isVisible}
          className="absolute inset-y-0 end-0 grid w-12 place-items-center rounded-e-xl text-zinc-500 transition hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-lime-300"
        >
          {isVisible ? (
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m4 4 16 16M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.7 10.7 0 0 1 12 4c5 0 8.5 4.4 9 5.1a1.5 1.5 0 0 1 0 1.8 14 14 0 0 1-2.4 2.7M6.2 6.2A14.7 14.7 0 0 0 3 9.1a1.5 1.5 0 0 0 0 1.8C3.5 11.6 7 16 12 16c.7 0 1.4-.1 2-.3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 9.1C3.5 8.4 7 4 12 4s8.5 4.4 9 5.1a1.5 1.5 0 0 1 0 1.8C20.5 11.6 17 16 12 16s-8.5-4.4-9-5.1a1.5 1.5 0 0 1 0-1.8Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <circle
                cx="12"
                cy="10"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}
