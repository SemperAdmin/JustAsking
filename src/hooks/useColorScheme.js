import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'justasking:scheme'

/**
 * Light/dark control.
 *
 * The style guide is explicit that the default theme is dark navy and light
 * parchment is the secondary toggle, so dark wins on a first visit regardless
 * of the OS setting. A returning visitor's own choice is remembered.
 *
 * Unlike the role accent, this is never encoded into a card's URL: it is the
 * reader's preference, not something the sender gets to impose.
 */
export default function useColorScheme() {
  const [scheme, setScheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') return stored
    } catch {
      // Private browsing can make localStorage throw on read.
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', scheme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, scheme)
    } catch {
      // Not being able to persist the choice is not worth failing over.
    }
  }, [scheme])

  const toggle = useCallback(() => {
    setScheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { scheme, toggle }
}
