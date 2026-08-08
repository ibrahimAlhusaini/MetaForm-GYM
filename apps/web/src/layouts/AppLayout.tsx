import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { MobileNavigation } from '../components/shell/MobileNavigation.js'
import { Sidebar } from '../components/shell/Sidebar.js'
import { TopBar } from '../components/shell/TopBar.js'
import { useMobileNavigation } from '../hooks/useMobileNavigation.js'
import { RouteLoadingFallback } from '../components/RouteLoadingFallback.js'

export function AppLayout() {
  const { t } = useTranslation('navigation')
  const mobileNavigation = useMobileNavigation()

  return (
    <div className="min-h-screen bg-[#090a0b] text-zinc-50">
      <a
        href="#main-content"
        className="fixed start-3 top-3 z-[70] -translate-y-20 rounded-lg bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        {t('shell.skipToContent')}
      </a>
      <Sidebar />
      <MobileNavigation
        isOpen={mobileNavigation.isOpen}
        onClose={mobileNavigation.close}
      />
      <div className="min-h-screen lg:ps-72">
        <TopBar
          menuButtonRef={mobileNavigation.menuButtonRef}
          onOpenMenu={mobileNavigation.open}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[100rem] px-4 py-8 outline-none sm:px-6 sm:py-10 lg:px-8 lg:py-12"
        >
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
