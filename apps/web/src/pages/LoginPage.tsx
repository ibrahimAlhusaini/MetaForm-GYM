import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../components/auth/AuthLayout.js'
import { FormField } from '../components/auth/FormField.js'
import { PasswordField } from '../components/auth/PasswordField.js'
import { useAuthStore } from '../store/auth.store.js'
import {
  createLoginFormSchema,
  type LoginFormValues,
} from '../validation/auth.schemas.js'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isSubmitting = useAuthStore((state) => state.isSubmitting)
  const authError = useAuthStore((state) => state.error)
  const loginFormSchema = useMemo(() => createLoginFormSchema(t), [t])
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
    if (succeeded) void navigate('/app', { replace: true })
  })

  return (
    <AuthLayout
      eyebrow={t('login.eyebrow')}
      title={t('login.title')}
      description={t('login.subtitle')}
    >
      <form
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        className="space-y-5"
      >
        {authError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200"
          >
            {t(`errors.${authError}`)}
          </div>
        ) : null}
        <FormField
          id="login-email"
          label={t('login.email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          registration={register('email')}
          error={errors.email?.message}
        />
        <PasswordField
          id="login-password"
          label={t('login.password')}
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder')}
          registration={register('password')}
          error={errors.password?.message}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-12 w-full rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-zinc-500">
        {t('login.noAccount')}{' '}
        <Link
          to="/register"
          className="font-medium text-lime-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
        >
          {t('login.register')}
        </Link>
      </p>
    </AuthLayout>
  )
}
