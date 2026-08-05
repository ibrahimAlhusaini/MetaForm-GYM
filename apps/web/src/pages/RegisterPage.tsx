import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../components/auth/AuthLayout.js'
import { FormField } from '../components/auth/FormField.js'
import { PasswordField } from '../components/auth/PasswordField.js'
import { useAuthStore } from '../store/auth.store.js'
import {
  registrationFormSchema,
  type RegistrationFormValues,
} from '../validation/auth.schemas.js'

const passwordRequirements = [
  '10 or more characters',
  'Uppercase and lowercase letters',
  'At least one number',
  'At least one special character',
]

export function RegisterPage() {
  const navigate = useNavigate()
  const registerAccount = useAuthStore((state) => state.register)
  const isSubmitting = useAuthStore((state) => state.isSubmitting)
  const authError = useAuthStore((state) => state.error)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const succeeded = await registerAccount({
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    })

    if (succeeded) {
      void navigate('/app', { replace: true })
    }
  })

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start with a stronger baseline"
      description="Create your secure account. Training features will be introduced in later stages."
    >
      <form
        onSubmit={(event) => {
          void onSubmit(event)
        }}
        noValidate
        className="space-y-5"
      >
        {authError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200"
          >
            {authError}
          </div>
        ) : null}

        <FormField
          id="register-name"
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          registration={register('fullName')}
          error={errors.fullName?.message}
        />
        <FormField
          id="register-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          registration={register('email')}
          error={errors.email?.message}
        />
        <PasswordField
          id="register-password"
          label="Password"
          autoComplete="new-password"
          placeholder="Create a secure password"
          registration={register('password')}
          error={errors.password?.message}
        />

        <div className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">
            Password requirements
          </p>
          <ul className="mt-2 grid gap-1.5 text-xs text-zinc-500 sm:grid-cols-2">
            {passwordRequirements.map((requirement) => (
              <li key={requirement} className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full bg-lime-300/80"
                  aria-hidden="true"
                />
                {requirement}
              </li>
            ))}
          </ul>
        </div>

        <PasswordField
          id="register-confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-12 w-full rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-lime-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
