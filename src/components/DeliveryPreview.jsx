import { useEffect, useRef, useState } from 'react'

import { deliveryOf } from '../constants'
import DeliveryStage from './DeliveryStage'

/**
 * Shows the sender what they are choosing.
 *
 * Without this, a delivery style is picked by name and first seen when the
 * sender opens their own link -- which is a poor way to choose between four
 * things whose whole point is how they look.
 *
 * Selecting a style replays it. Arriving on the page does not: an animation
 * nobody asked for on load is exactly what the style guide's motion budget is
 * there to prevent, and the exception this app takes is for motion the reader
 * requested.
 */
export default function DeliveryPreview({ styleId }) {
  const delivery = deliveryOf(styleId)

  // 0 means never played, so the stage sits closed. Every replay increments,
  // which remounts the stage and restarts its animations from the first frame --
  // CSS animations do not otherwise re-run when the same classes are reapplied.
  const [run, setRun] = useState(0)
  const firstRender = useRef(true)

  useEffect(() => {
    // Skip the initial mount; play on every later change of style.
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setRun((current) => current + 1)
  }, [styleId])

  const playing = run > 0

  return (
    <div className="mt-3 rounded-button border border-border bg-bg-sunken p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Preview</p>
        <button
          type="button"
          onClick={() => setRun((current) => current + 1)}
          className="rounded-button border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
        >
          {playing ? 'Play again' : 'Play'}
        </button>
      </div>

      <div
        className="delivery mx-auto mt-3 max-w-[15rem]"
        data-preview=""
        data-delivery={delivery.id}
        data-phase={playing ? 'opening' : 'sealed'}
        // The preview is always an explicit request, so it carries the same
        // marker that lets the sequence through on a reduced-motion device.
        data-motion={playing ? 'play' : undefined}
      >
        <DeliveryStage key={run} id={delivery.id} />
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">{delivery.hint}</p>
    </div>
  )
}
