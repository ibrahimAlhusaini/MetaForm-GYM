import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../store/auth.store.js'

export function AuthInitializer({ children }: { children: ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const isInitializing = useAuthStore((state) => state.isInitializing)

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  if (isInitializing) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-[#090a0b] text-zinc-50"
        aria-busy="true"
      >
        <div className="text-center">
          <span
            className="mx-auto block size-9 animate-spin rounded-full border-2 border-white/15 border-t-lime-300"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm text-zinc-400">Restoring your session…</p>
        </div>
      </main>
    )
  }

  return children
}
