import { useEffect, useMemo, useRef, useState } from 'react'

import { MAX_TEXT_ANSWER_LENGTH, kindOf } from '../constants'
import { encodeState, isComplete } from '../utils/urlState'
import { Card } from './Layout'
import Delivery from './Delivery'
import ShareLink from './ShareLink'

/** Pause after a choice is tapped, so the selection is seen before it advances. */
const ADVANCE_MS = 260

/**
 * The recipient's view: open the delivery, answer one question at a time, get a
 * link back.
 *
 * Questions are presented singly rather than as a form. A card is a
 * conversation, not paperwork, and a stack of five prompts at once reads as the
 * latter. It also keeps each prompt at a readable size on a phone.
 *
 * Answers are kept local instead of being pushed into <App/>'s state. Writing
 * them upward would flip the app straight to <CardResult/> the moment the last
 * one landed, and the recipient would never see the "send this back" step.
 */
export default function CardViewer({ card }) {
  const [answers, setAnswers] = useState(() => card.q.map((question) => question.a))
  const [step, setStep] = useState(0)
  const advanceRef = useRef(null)

  useEffect(() => () => clearTimeout(advanceRef.current), [])

  const answered = useMemo(
    () => ({ ...card, q: card.q.map((question, i) => ({ ...question, a: answers[i] })) }),
    [card, answers],
  )

  const total = card.q.length
  const onReview = step >= total
  const complete = isComplete(answered)

  function commit(index, value, advance) {
    setAnswers((current) => current.map((answer, i) => (i === index ? value : answer)))
    if (!advance) return
    clearTimeout(advanceRef.current)
    advanceRef.current = setTimeout(() => setStep(index + 1), ADVANCE_MS)
  }

  return (
    <Delivery styleId={card.t}>
      {onReview ? (
        <Card className="ja-rise">
          <p className="eyebrow">{complete ? 'Ready to send' : 'Not finished'}</p>

          {complete ? (
            <>
              <p className="mt-3 text-sm text-foreground">
                They cannot see this yet &mdash; nothing was sent anywhere. Copy the link and
                send it back.
              </p>
              <div className="mt-4">
                <ShareLink url={encodeState(answered)} label="Copy and send this link back" />
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              One of the questions still needs an answer.
            </p>
          )}

          <ol className="mt-6 divide-y divide-border border-y border-border">
            {card.q.map((question, index) => (
              <li key={index} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold break-words text-foreground">
                    {question.p}
                  </p>
                  <p className="mt-0.5 text-sm break-words text-muted-foreground">
                    {answers[index] || 'Not answered'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  className="shrink-0 rounded-button border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                >
                  Change
                </button>
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <QuestionStep
          // Remounting per step is deliberate: it replays the entrance
          // animation and moves focus, so each question arrives rather than
          // swapping in place.
          key={step}
          question={card.q[step]}
          index={step}
          total={total}
          value={answers[step]}
          onAnswer={(value, advance) => commit(step, value, advance)}
          onBack={step > 0 ? () => setStep(step - 1) : null}
          onNext={() => setStep(step + 1)}
        />
      )}
    </Delivery>
  )
}

/**
 * A single question, filling the card on its own.
 *
 * A choice advances itself once tapped -- the tap is the answer, and asking for
 * a second one to confirm it would be noise. Text and dates have no natural
 * completion, so they get an explicit button.
 */
function QuestionStep({ question, index, total, value, onAnswer, onBack, onNext }) {
  const headingRef = useRef(null)
  const kind = kindOf(question.k)
  const last = index === total - 1

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Card className="ja-rise">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">
          {total > 1 ? `Question ${index + 1} of ${total}` : 'Someone is asking'}
        </p>
        {total > 1 ? (
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-chip ${i <= index ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Rendered as a text child, never as HTML. */}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 text-2xl font-bold text-balance break-words text-foreground outline-none"
      >
        {question.p}
      </h1>

      {question.k === 'c' ? (
        <div className="mt-5 grid gap-2.5">
          {question.o.map((option, optionIndex) => {
            const selected = value === option
            return (
              <button
                key={`${optionIndex}-${option}`}
                type="button"
                aria-pressed={selected}
                onClick={() => onAnswer(option, true)}
                style={{ animationDelay: `${100 + optionIndex * 60}ms` }}
                className={`ja-stagger rounded-button border px-4 py-3 text-lg font-semibold break-words transition-colors ${
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
        <div className="ja-stagger mt-5" style={{ animationDelay: '100ms' }}>
          <input
            type={kind.input}
            value={value}
            maxLength={question.k === 'x' ? MAX_TEXT_ANSWER_LENGTH : undefined}
            placeholder={question.k === 'x' ? 'Your answer' : undefined}
            onChange={(event) => onAnswer(event.target.value, false)}
            aria-label={question.p}
            className="w-full rounded-button border border-input bg-bg-sunken px-3 py-3 text-lg text-foreground placeholder:text-subtle-foreground"
          />
          <button
            type="button"
            disabled={!value}
            onClick={onNext}
            className="mt-3 w-full rounded-button bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {/* A choice already advances on tap; this is the way past one that has
         * been answered on an earlier visit. */}
        {question.k === 'c' && value ? (
          <button
            type="button"
            onClick={onNext}
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            {last ? 'Done' : 'Next'}
          </button>
        ) : null}
      </div>
    </Card>
  )
}
