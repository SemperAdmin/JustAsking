import { useCallback, useEffect, useRef, useState } from 'react'

import { Card } from './Layout'

/** How long the CSS sequence in justasking.css runs before the letter is out. */
const SEQUENCE_MS = 1180

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Gates the recipient's questions behind a sealed envelope.
 *
 * Opening is a tap, not a timer. That is the whole reason this is allowed to
 * run past the style guide's motion budget: nobody has motion imposed on them
 * on the way to somewhere else, and the wait is something the recipient chose.
 *
 * A reader with Reduce Motion enabled gets the seal opened instantly, and is
 * told why -- an animation that silently does not happen is indistinguishable
 * from one that is broken. They can still ask for it explicitly: the OS setting
 * is a default for motion nobody asked for, not a veto over motion someone just
 * requested by name.
 */
export default function SealedDispatch({ children }) {
  const [phase, setPhase] = useState('sealed')
  const [forced, setForced] = useState(false)
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.(REDUCED_QUERY).matches ?? false,
  )
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // The setting can be toggled while the page is open, so track it rather than
  // sampling once.
  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_QUERY)
    if (!query) return
    const onChange = (event) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const open = useCallback(
    (force = false) => {
      if (phase !== 'sealed') return
      if (reduced && !force) {
        setPhase('open')
        return
      }
      // Marks the subtree so the forced-play block in justasking.css can
      // override the token mirror's blanket animation suppression.
      if (force) setForced(true)
      setPhase('opening')
      timerRef.current = setTimeout(() => setPhase('open'), SEQUENCE_MS)
    },
    [phase, reduced],
  )

  if (phase === 'open') return children

  return (
    <Card className="text-center" data-phase={phase} data-motion={forced ? 'forced' : undefined}>
      <p className="eyebrow">Sealed dispatch</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Someone has addressed a question to you.
      </p>

      <div className="dispatch mx-auto mt-6 max-w-xs">
        {/* Stacked back to front: back panel, letter, front panel, flap, seal.
         * The letter starts tucked behind the front panel, which is what makes
         * it look like it came out of the envelope rather than off the top. */}
        <div className="dispatch__envelope">
          <div className="dispatch__back" />
          <div className="dispatch__letter" />
          <div className="dispatch__front" />
          <div className="dispatch__flap" />
          <div className="dispatch__seal">
            <span className="dispatch__wax dispatch__wax--l" aria-hidden="true">
              <span className="dispatch__sigil">SA</span>
            </span>
            <span className="dispatch__wax dispatch__wax--r" aria-hidden="true">
              <span className="dispatch__sigil">SA</span>
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => open()}
        disabled={phase === 'opening'}
        className="mt-6 w-full rounded-button bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        {phase === 'opening' ? 'Opening…' : 'Break the seal'}
      </button>

      {reduced && phase === 'sealed' ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Reduce Motion is on for this device, so this opens instantly.{' '}
          <button
            type="button"
            onClick={() => open(true)}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Play the animation anyway
          </button>
        </p>
      ) : null}
    </Card>
  )
}
