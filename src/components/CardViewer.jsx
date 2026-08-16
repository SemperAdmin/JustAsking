import { useState } from 'react'

import { encodeState } from '../utils/urlState'
import { Card } from './Layout'
import ShareLink from './ShareLink'

/**
 * The recipient's view: read the question, pick an answer, get a link back.
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
    <Card>
      <p className="eyebrow">Someone is asking</p>

      {/* Rendered as a text child, never as HTML. */}
      <h1 className="mt-2 text-3xl font-bold text-balance break-words text-foreground">{card.q}</h1>

      <div className="mt-6 grid gap-2.5">
        {card.o.map((option, index) => (
          <button
            key={`${index}-${option}`}
            type="button"
            onClick={() => handleAnswer(option)}
            className="rounded-button border border-border bg-bg-sunken px-4 py-3 text-lg font-semibold break-words text-foreground transition-colors hover:border-primary hover:bg-surface-2"
          >
            {option}
          </button>
        ))}
      </div>
    </Card>
  )
}
