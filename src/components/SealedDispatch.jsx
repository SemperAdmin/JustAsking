import { useCallback, useEffect, useRef, useState } from 'react'

import { Card } from './Layout'

/** How long the CSS sequence in justasking.css runs before the card is out. */
const SEQUENCE_MS = 760

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Gates the recipient's question behind a sealed envelope.
 *
 * Opening is a tap, not a timer. That is the whole reason this is allowed to
 * run past the style guide's motion budget: nobody has motion imposed on them
 * on the way to somewhere else, and the wait is something the recipient chose.
 *
 * Reduced-motion readers still get the seal and still break it -- that beat is
 * content, not decoration. It just opens instantly.
 */
export default function SealedDispatch({ children }) {
  const [phase, setPhase] = useState('sealed')
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const open = useCallback(() => {
    if (phase !== 'sealed') return
    if (prefersReducedMotion()) {
      setPhase('open')
      return
    }
    setPhase('opening')
    timerRef.current = setTimeout(() => setPhase('open'), SEQUENCE_MS)
  }, [phase])

  if (phase === 'open') return children

  return (
    <Card className="text-center" data-phase={phase}>
      <p className="eyebrow">Sealed dispatch</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Someone has addressed a question to you.
      </p>

      <div className="dispatch mx-auto mt-6 max-w-xs">
        <div className="dispatch__envelope">
          <div className="dispatch__pocket" />
          <div className="dispatch__flap" />
          <div className="dispatch__seal">
            {/* Two halves of one disc, clipped along an irregular break. */}
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
        onClick={open}
        disabled={phase === 'opening'}
        className="mt-6 w-full rounded-button bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        {phase === 'opening' ? 'Opening…' : 'Break the seal'}
      </button>
    </Card>
  )
}
