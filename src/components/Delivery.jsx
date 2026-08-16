import { useCallback, useEffect, useRef, useState } from 'react'

import { deliveryOf } from '../constants'
import { Card } from './Layout'

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

/** The four stages. Markup only -- justasking.css drives every sequence. */
const STAGES = {
  env: () => (
    <>
      {/* Back to front: back panel, letter, front panel, flap, seal. */}
      <div className="env__back" />
      <div className="env__letter paper-ruled" />
      <div className="env__front" />
      <div className="env__flap" />
      <div className="env__seal">
        <span className="env__wax env__wax--l" aria-hidden="true">
          <span className="env__sigil">SA</span>
        </span>
        <span className="env__wax env__wax--r" aria-hidden="true">
          <span className="env__sigil">SA</span>
        </span>
      </div>
    </>
  ),
  stamp: () => (
    <>
      <div className="stamp__page paper-ruled" />
      <div className="stamp__mark">FOR ACTION</div>
    </>
  ),
  wire: () => (
    <div className="wire__panel">
      <p className="wire__label">INCOMING</p>
      <div className="wire__bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="wire__scan" aria-hidden="true" />
    </div>
  ),
  scroll: () => (
    <>
      <div className="scroll__body paper-ruled" />
      <div className="scroll__rod scroll__rod--top" />
      <div className="scroll__rod scroll__rod--bottom" />
      <div className="scroll__cord" />
    </>
  ),
}

/**
 * Holds the recipient's questions behind whichever delivery the sender chose.
 *
 * Opening is a tap, not a timer. That is the whole reason this is allowed to
 * run past the style guide's motion budget: nobody has motion imposed on them
 * on the way to somewhere else, and the wait is something the recipient chose.
 *
 * The sequence plays by default for everyone, including devices asking for
 * reduced motion -- a deliberate override argued in the README. It stays an
 * override rather than a dismissal: a reader whose device asked for less motion
 * is told the card animates and given one tap to turn it off, remembered so
 * they never sit through it twice.
 */
export default function Delivery({ styleId, children }) {
  const delivery = deliveryOf(styleId)
  const Stage = STAGES[delivery.id] ?? STAGES.env

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

  const open = useCallback(
    (animate) => {
      setPhase(animate ? 'opening' : 'open')
      if (!animate) return
      timerRef.current = setTimeout(() => setPhase('open'), delivery.ms)
    },
    [delivery.ms],
  )

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
      data-delivery={delivery.id}
      data-phase={phase}
      // Marks the subtree so the play block in justasking.css can override the
      // token mirror's blanket animation suppression on a reduced-motion device.
      data-motion={phase === 'opening' ? 'play' : undefined}
    >
      <p className="eyebrow">{delivery.label}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Someone has addressed a question to you.
      </p>

      <div className="delivery mx-auto mt-6 max-w-xs">
        <div className="delivery__stage">
          <Stage />
        </div>
      </div>

      <button
        type="button"
        onClick={() => open(willAnimate)}
        disabled={phase === 'opening'}
        className="mt-6 w-full rounded-button bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        {phase === 'opening' ? 'Opening…' : delivery.action}
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
