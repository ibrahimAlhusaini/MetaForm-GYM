import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  appPaths,
  type AppNavigationItem,
} from '../../config/navigation.config.js'

interface NavigationItemProps {
  item: AppNavigationItem
  onNavigate?: () => void
}

export function NavigationItem({ item, onNavigate }: NavigationItemProps) {
  const { t } = useTranslation('navigation')
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.path === appPaths.home}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300',
          isActive
            ? 'bg-lime-300 text-zinc-950 shadow-[0_8px_28px_rgba(217,249,75,0.08)]'
            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100',
        ].join(' ')
      }
    >
      <Icon
        className="size-[1.15rem] shrink-0"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span>{t(item.labelKey)}</span>
    </NavLink>
  )
}
