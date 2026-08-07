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
  createRegistrationFormSchema,
  type RegistrationFormValues,
} from '../validation/auth.schemas.js'

const passwordRequirementIndexes = [0, 1, 2, 3] as const

export function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const registerAccount = useAuthStore((state) => state.register)
  const isSubmitting = useAuthStore((state) => state.isSubmitting)
  const authError = useAuthStore((state) => state.error)
  const registrationFormSchema = useMemo(
    () => createRegistrationFormSchema(t),
    [t],
  )
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
    if (succeeded) void navigate('/app', { replace: true })
  })

  return (
    <AuthLayout
      eyebrow={t('register.eyebrow')}
      title={t('register.title')}
      description={t('register.subtitle')}
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
          id="register-name"
          label={t('register.name')}
          type="text"
          autoComplete="name"
          placeholder={t('register.namePlaceholder')}
          registration={register('fullName')}
          error={errors.fullName?.message}
        />
        <FormField
          id="register-email"
          label={t('register.email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          registration={register('email')}
          error={errors.email?.message}
        />
        <PasswordField
          id="register-password"
          label={t('register.password')}
          autoComplete="new-password"
          placeholder={t('register.passwordPlaceholder')}
          registration={register('password')}
          error={errors.password?.message}
        />
        <div className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">
            {t('register.requirementsTitle')}
          </p>
          <ul className="mt-2 grid gap-1.5 text-xs text-zinc-500 sm:grid-cols-2">
            {passwordRequirementIndexes.map((index) => (
              <li key={index} className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full bg-lime-300/80"
                  aria-hidden="true"
                />
                {t(`register.requirements.${String(index)}`)}
              </li>
            ))}
          </ul>
        </div>
        <PasswordField
          id="register-confirm-password"
          label={t('register.confirmPassword')}
          autoComplete="new-password"
          placeholder={t('register.confirmPlaceholder')}
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-12 w-full rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t('register.submitting') : t('register.submit')}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-zinc-500">
        {t('register.hasAccount')}{' '}
        <Link
          to="/login"
          className="font-medium text-lime-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
        >
          {t('register.login')}
        </Link>
      </p>
    </AuthLayout>
  )
}
