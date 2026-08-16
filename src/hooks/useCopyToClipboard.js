import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Copy text to the clipboard and report the outcome for ~2 seconds.
 *
 * navigator.clipboard is unavailable outside secure contexts, which includes
 * opening the built index.html straight off disk -- a completely reasonable way
 * to use an app that has no server. The legacy execCommand path covers that.
 *
 * @returns {{ copy: (text: string) => Promise<boolean>, status: 'idle'|'copied'|'error' }}
 */
export default function useCopyToClipboard(resetAfterMs = 2000) {
  const [status, setStatus] = useState('idle')
  const timeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const flash = useCallback(
    (next) => {
      setStatus(next)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setStatus('idle'), resetAfterMs)
    },
    [resetAfterMs],
  )

  const copy = useCallback(
    async (text) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
          flash('copied')
          return true
        }
      } catch {
        // Permission denied or a non-secure context -- fall through.
      }

      try {
        const scratch = document.createElement('textarea')
        scratch.value = text
        scratch.setAttribute('readonly', '')
        scratch.style.position = 'fixed'
        scratch.style.opacity = '0'
        document.body.appendChild(scratch)
        scratch.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(scratch)
        flash(ok ? 'copied' : 'error')
        return ok
      } catch {
        flash('error')
        return false
      }
    },
    [flash],
  )

  return { copy, status }
}
