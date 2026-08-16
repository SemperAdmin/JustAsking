import { useEffect, useRef, useState } from 'react'

import { encodeState } from '../utils/urlState'
import { Card } from './Layout'
import SealedDispatch from './SealedDispatch'
import ShareLink from './ShareLink'

/**
 * The recipient's view: break the seal, read the question, pick an answer, get
 * a link back.
 *
 * The choice is kept local instead of being pushed into <App/>'s state. Writing
 * it upward would flip the app straight to <CardResult/>, and the recipient
 * would never see the "send this back" step.
 *
 * The question is set in the body face, not the display face: Bebas Neue is
 * uppercase and condensed, which stops being readable well before 200
 * characters. The display surface for this flow is the answer on the result.
 */
export default function CardViewer({ card }) {
  const [replyUrl, setReplyUrl] = useState('')
  const [chosen, setChosen] = useState('')

  function handleAnswer(option) {
    setChosen(option)
    setReplyUrl(encodeState({ ...card, a: option }))
  }

  if (replyUrl) {
    return (
      <Card>
        <p className="eyebrow">You answered</p>
        <p className="wordmark mt-2 text-4xl break-words text-primary">{chosen}</p>

        <p className="mt-4 text-sm text-foreground">
          They cannot see it yet &mdash; nothing was sent anywhere. Copy this link and send it
          back so they get your answer.
        </p>

        <div className="mt-4">
          <ShareLink url={replyUrl} label="Copy and send this link back" />
        </div>

        <button
          type="button"
          onClick={() => {
            setReplyUrl('')
            setChosen('')
          }}
          className="mt-4 text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Pick a different answer
        </button>
      </Card>
    )
  }

  return (
    <SealedDispatch>
      <Question card={card} onAnswer={handleAnswer} />
    </SealedDispatch>
  )
}

/**
 * The question itself, rendered once the seal is broken.
 *
 * Focus moves to the heading on mount so that breaking the seal actually
 * announces the question to a screen reader, rather than silently swapping the
 * contents of the page underneath someone.
 */
function Question({ card, onAnswer }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Card className="ja-rise">
      <p className="eyebrow">Someone is asking</p>

      {/* Rendered as a text child, never as HTML. */}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-3xl font-bold text-balance break-words text-foreground outline-none"
      >
        {card.q}
      </h1>

      <div className="mt-6 grid gap-2.5">
        {card.o.map((option, index) => (
          <button
            key={`${index}-${option}`}
            type="button"
            onClick={() => onAnswer(option)}
            // Stagger only the entrance; the delay is presentational and the
            // button is clickable from the first frame regardless.
            style={{ animationDelay: `${120 + index * 60}ms` }}
            className="ja-stagger rounded-button border border-border bg-bg-sunken px-4 py-3 text-lg font-semibold break-words text-foreground transition-colors hover:border-primary hover:bg-surface-2"
          >
            {option}
          </button>
        ))}
      </div>
    </Card>
  )
}
