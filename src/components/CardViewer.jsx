import { useEffect, useMemo, useRef, useState } from 'react'

import { MAX_TEXT_ANSWER_LENGTH, kindOf } from '../constants'
import { encodeState, isComplete } from '../utils/urlState'
import { Card } from './Layout'
import SealedDispatch from './SealedDispatch'
import ShareLink from './ShareLink'

/**
 * The recipient's view: break the seal, answer every question, get a link back.
 *
 * Answers are kept local instead of being pushed into <App/>'s state. Writing
 * them upward would flip the app straight to <CardResult/> the moment the last
 * one landed, and the recipient would never see the "send this back" step.
 */
export default function CardViewer({ card }) {
  const [answers, setAnswers] = useState(() => card.q.map((question) => question.a))

  const answered = useMemo(
    () => ({ ...card, q: card.q.map((question, i) => ({ ...question, a: answers[i] })) }),
    [card, answers],
  )

  const complete = isComplete(answered)

  function setAnswer(index, value) {
    setAnswers((current) => current.map((answer, i) => (i === index ? value : answer)))
  }

  return (
    <SealedDispatch>
      <Card className="ja-rise">
        <p className="eyebrow">
          {card.q.length > 1 ? `Someone is asking ${card.q.length} things` : 'Someone is asking'}
        </p>

        <form className="mt-4 space-y-6" onSubmit={(event) => event.preventDefault()}>
          {card.q.map((question, index) => (
            <QuestionField
              key={index}
              question={question}
              index={index}
              value={answers[index]}
              autoFocus={index === 0}
              onChange={(value) => setAnswer(index, value)}
            />
          ))}
        </form>

        {/* No submit button: the reply link appears as soon as every question
         * has an answer, and updates as answers change. For the common
         * single-choice card that keeps the whole interaction to one tap. */}
        {complete ? (
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm text-foreground">
              They cannot see this yet &mdash; nothing was sent anywhere. Copy the link and send
              it back.
            </p>
            <div className="mt-3">
              <ShareLink url={encodeState(answered)} label="Copy and send this link back" />
            </div>
          </div>
        ) : (
          <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
            Answer {card.q.length > 1 ? 'every question' : 'the question'} to get your reply
            link.
          </p>
        )}
      </Card>
    </SealedDispatch>
  )
}

/**
 * One question and its control.
 *
 * Text and date questions use native inputs, so the date picker is the one the
 * reader's own OS provides. Choice questions stay as buttons rather than a
 * select: they are the common case and a tap should not cost a menu.
 */
function QuestionField({ question, index, value, autoFocus, onChange }) {
  const headingRef = useRef(null)
  const kind = kindOf(question.k)

  // Focus the first prompt when the seal breaks, so the reveal is announced
  // rather than silently swapping the contents of the page.
  useEffect(() => {
    if (autoFocus) headingRef.current?.focus()
  }, [autoFocus])

  const labelId = `q-${index}-label`

  return (
    <div
      className="ja-stagger"
      style={{ animationDelay: `${120 + index * 70}ms` }}
      role="group"
      aria-labelledby={labelId}
    >
      {/* Rendered as a text child, never as HTML. */}
      <h2
        id={labelId}
        ref={headingRef}
        tabIndex={autoFocus ? -1 : undefined}
        className="text-xl font-bold text-balance break-words text-foreground outline-none"
      >
        {question.p}
      </h2>

      {question.k === 'c' ? (
        <div className="mt-3 grid gap-2">
          {question.o.map((option, optionIndex) => {
            const selected = value === option
            return (
              <button
                key={`${optionIndex}-${option}`}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(selected ? '' : option)}
                className={`rounded-button border px-4 py-3 text-lg font-semibold break-words transition-colors ${
                  selected
                    ? 'border-primary bg-surface-2 text-foreground'
                    : 'border-border bg-bg-sunken text-foreground hover:border-primary hover:bg-surface-2'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          type={kind.input}
          value={value}
          maxLength={question.k === 'x' ? MAX_TEXT_ANSWER_LENGTH : undefined}
          placeholder={question.k === 'x' ? 'Your answer' : undefined}
          onChange={(event) => onChange(event.target.value)}
          aria-labelledby={labelId}
          className="mt-3 w-full rounded-button border border-input bg-bg-sunken px-3 py-3 text-lg text-foreground placeholder:text-subtle-foreground"
        />
      )}
    </div>
  )
}
