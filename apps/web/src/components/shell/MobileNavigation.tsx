import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { BrandMark } from './BrandMark.js'
import { NavigationList } from './NavigationList.js'
import { UserSummary } from './UserSummary.js'

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const keepFocusInDrawer = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      const firstElement = focusableElements.item(0)
      const lastElement = focusableElements.item(focusableElements.length - 1)

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', keepFocusInDrawer)
    return () => {
      document.removeEventListener('keydown', keepFocusInDrawer)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close application menu"
        onClick={onClose}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Application menu"
        className="relative flex h-full w-[min(20rem,88vw)] flex-col border-r border-white/10 bg-[#0d0f10] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
          <BrandMark />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close application menu"
            className="grid size-10 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <NavigationList onNavigate={onClose} />
        </div>
        <div className="border-t border-white/8 px-5 py-5">
          <UserSummary />
        </div>
      </aside>
    </div>
  )
}
