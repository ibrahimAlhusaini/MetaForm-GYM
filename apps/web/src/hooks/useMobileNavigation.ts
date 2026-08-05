import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useLocation } from 'react-router'

interface MobileNavigationState {
  isOpen: boolean
  menuButtonRef: RefObject<HTMLButtonElement | null>
  open: () => void
  close: () => void
}

export function useMobileNavigation(): MobileNavigationState {
  const [isOpen, setIsOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const previousPathname = useRef(location.pathname)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    window.queueMicrotask(() => menuButtonRef.current?.focus())
  }, [])

  useEffect(() => {
    if (previousPathname.current !== location.pathname && isOpen) {
      close()
    }

    previousPathname.current = location.pathname
  }, [close, isOpen, location.pathname])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [close, isOpen])

  return { isOpen, menuButtonRef, open, close }
}
