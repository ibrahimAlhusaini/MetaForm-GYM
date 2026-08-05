import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../components/auth/AuthLayout.js'
import { FormField } from '../components/auth/FormField.js'
import { PasswordField } from '../components/auth/PasswordField.js'
import { useAuthStore } from '../store/auth.store.js'
import {
  loginFormSchema,
  type LoginFormValues,
} from '../validation/auth.schemas.js'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isSubmitting = useAuthStore((state) => state.isSubmitting)
  const authError = useAuthStore((state) => state.error)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const succeeded = await login({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    })

    if (succeeded) {
      void navigate('/app', { replace: true })
    }
  })

  return (
    <AuthLayout
      eyebrow="Member access"
      title="Welcome back"
      description="Sign in to continue to your MetaForm GYM workspace."
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
          id="login-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          registration={register('email')}
          error={errors.email?.message}
        />
        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          registration={register('password')}
          error={errors.password?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-12 w-full rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-zinc-500">
        New to MetaForm GYM?{' '}
        <Link
          to="/register"
          className="font-medium text-lime-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
