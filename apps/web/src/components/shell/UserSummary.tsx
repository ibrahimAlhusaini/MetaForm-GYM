import { useAuthStore } from '../../store/auth.store.js'
import { useTranslation } from 'react-i18next'

interface UserSummaryProps {
  compact?: boolean
}

const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

  return initials || 'M'
}

export function UserSummary({ compact = false }: UserSummaryProps) {
  const { t } = useTranslation('navigation')
  const user = useAuthStore((state) => state.user)
  const name = user?.profile?.fullName ?? t('shell.member')

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full border border-lime-300/25 bg-lime-300/8 text-xs font-bold text-lime-300"
        aria-hidden="true"
      >
        {getInitials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-100">{name}</p>
        {compact ? null : (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{user?.email}</p>
        )}
      </div>
    </div>
  )
}
