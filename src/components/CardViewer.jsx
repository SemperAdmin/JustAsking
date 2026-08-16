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
        <p className="text-sm font-medium text-muted">You answered</p>
        <p className="mt-1 text-3xl font-bold text-accent">{chosen}</p>

        <p className="mt-4 text-sm text-ink">
          They can&rsquo;t see it yet &mdash; nothing was sent anywhere. Copy this link and send it
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
          className="mt-4 text-sm font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Pick a different answer
        </button>
      </Card>
    )
  }

  return (
    <Card>
      <p className="text-sm font-medium text-muted">Someone is asking&hellip;</p>

      {/* Rendered as a text child, never as HTML. */}
      <h1 className="mt-2 text-2xl font-bold text-balance text-ink sm:text-3xl">{card.q}</h1>

      <div className="mt-6 grid gap-3">
        {card.o.map((option, index) => (
          <button
            key={`${index}-${option}`}
            type="button"
            onClick={() => handleAnswer(option)}
            className="rounded-lg border-2 border-edge bg-page px-4 py-3 text-lg font-semibold text-ink transition-colors hover:border-accent hover:bg-accent-soft"
          >
            {option}
          </button>
        ))}
      </div>
    </Card>
  )
}
