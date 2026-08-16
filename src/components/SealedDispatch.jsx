import { useCallback, useEffect, useRef, useState } from 'react'

import { Card } from './Layout'

/** How long the CSS sequence in justasking.css runs before the letter is out. */
const SEQUENCE_MS = 1180

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'
const MOTION_KEY = 'justasking:motion'

function storedChoice() {
  try {
    const stored = localStorage.getItem(MOTION_KEY)
    return stored === 'skip' || stored === 'play' ? stored : null
  } catch {
    // Private browsing can make localStorage throw on read.
    return null
  }
}

/**
 * Gates the recipient's questions behind a sealed envelope.
 *
 * The sequence plays by default for everyone, including readers whose device
 * asks for reduced motion. That is a deliberate override of
 * `prefers-reduced-motion`, made on the product owner's call and argued in the
 * README -- the short version being that most people who have the setting on
 * have it on for battery or taste, and this is a single user-initiated beat
 * rather than motion imposed on the way to somewhere else.
 *
 * It is an override, not a dismissal. A reader whose device asked for less
 * motion is told the seal animates and given one tap to turn it off, and that
 * choice is remembered. Some people have the setting on because animation makes
 * them ill, and they should not have to sit through this on every card.
 */
export default function SealedDispatch({ children }) {
  const [phase, setPhase] = useState('sealed')
  const [choice, setChoice] = useState(storedChoice)
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

  // Animation is the default; only an explicit "skip" turns it off.
  const willAnimate = choice !== 'skip'

  const open = useCallback((animate) => {
    setPhase(animate ? 'opening' : 'open')
    if (!animate) return
    timerRef.current = setTimeout(() => setPhase('open'), SEQUENCE_MS)
  }, [])

  /** Record a preference and act on it in the same tap. */
  function chooseAndOpen(mode) {
    setChoice(mode)
    try {
      localStorage.setItem(MOTION_KEY, mode)
    } catch {
      // Not being able to persist the choice is not worth failing over.
    }
    open(mode === 'play')
  }

  if (phase === 'open') return children

  return (
    <Card
      className="text-center"
      data-phase={phase}
      // Marks the subtree so the play block in justasking.css can override the
      // token mirror's blanket animation suppression on a reduced-motion device.
      data-motion={phase === 'opening' ? 'play' : undefined}
    >
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
        onClick={() => open(willAnimate)}
        disabled={phase === 'opening'}
        className="mt-6 w-full rounded-button bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        {phase === 'opening' ? 'Opening…' : 'Break the seal'}
      </button>

      {/* Only surfaced to readers whose device asked for less motion. Everyone
       * else gets the sequence without being asked a question about it. */}
      {reduced && phase === 'sealed' ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {willAnimate ? (
            <>
              This card animates as it opens.{' '}
              <button
                type="button"
                onClick={() => chooseAndOpen('skip')}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Skip the animation
              </button>
            </>
          ) : (
            <>
              The animation is off on this device.{' '}
              <button
                type="button"
                onClick={() => chooseAndOpen('play')}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Play it
              </button>
            </>
          )}
        </p>
      ) : null}
    </Card>
  )
}
