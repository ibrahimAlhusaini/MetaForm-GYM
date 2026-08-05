import { LogOut, Menu } from 'lucide-react'
import type { RefObject } from 'react'
import { useLocation } from 'react-router'
import { getPageTitle } from '../../config/navigation.config.js'
import { useAuthStore } from '../../store/auth.store.js'
import { BrandMark } from './BrandMark.js'
import { UserSummary } from './UserSummary.js'

interface TopBarProps {
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onOpenMenu: () => void
}

export function TopBar({ menuButtonRef, onOpenMenu }: TopBarProps) {
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const isSubmitting = useAuthStore((state) => state.isSubmitting)

  return (
    <header
      aria-label="Application toolbar"
      className="sticky top-0 z-20 border-b border-white/8 bg-[#090a0b]/90 backdrop-blur-xl"
    >
      <div className="flex h-18 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onOpenMenu}
            aria-label="Open application menu"
            aria-haspopup="dialog"
            className="grid size-10 place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:border-white/20 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <BrandMark compact />
        </div>

        <p className="min-w-0 flex-1 truncate text-base font-semibold text-zinc-100 sm:text-lg">
          {getPageTitle(location.pathname)}
        </p>

        <div className="hidden border-r border-white/10 pr-5 sm:block">
          <UserSummary compact />
        </div>
        <button
          type="button"
          aria-label="Log out"
          onClick={() => {
            void logout()
          }}
          disabled={isSubmitting}
          className="flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-400 transition hover:border-lime-300/30 hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">
            {isSubmitting ? 'Signing out…' : 'Log out'}
          </span>
          <span className="sr-only sm:hidden">Log out</span>
        </button>
      </div>
    </header>
  )
}
