import { Outlet } from 'react-router'
import { MobileNavigation } from '../components/shell/MobileNavigation.js'
import { Sidebar } from '../components/shell/Sidebar.js'
import { TopBar } from '../components/shell/TopBar.js'
import { useMobileNavigation } from '../hooks/useMobileNavigation.js'

export function AppLayout() {
  const mobileNavigation = useMobileNavigation()

  return (
    <div className="min-h-screen bg-[#090a0b] text-zinc-50">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[70] -translate-y-20 rounded-lg bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Skip to main content
      </a>
      <Sidebar />
      <MobileNavigation
        isOpen={mobileNavigation.isOpen}
        onClose={mobileNavigation.close}
      />
      <div className="min-h-screen lg:pl-72">
        <TopBar
          menuButtonRef={mobileNavigation.menuButtonRef}
          onOpenMenu={mobileNavigation.open}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[100rem] px-4 py-8 outline-none sm:px-6 sm:py-10 lg:px-8 lg:py-12"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
