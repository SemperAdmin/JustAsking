import { useMemo, useState } from 'react'

import {
  DEFAULT_DELIVERY,
  DELIVERIES,
  MAX_OPTIONS,
  MAX_QUESTIONS,
  URL_LENGTH_HARD_MAX,
} from '../constants'
import { createEmptyQuestion, encodeState, projectedAnsweredLength } from '../utils/urlState'
import { Card } from './Layout'
import DeliveryPreview from './DeliveryPreview'
import QuestionEditor from './QuestionEditor'
import ShareLink from './ShareLink'

/**
 * Trim a draft question down to what is worth sending.
 * Returns null if there is nothing answerable in it.
 */
function finalize(question) {
  const prompt = question.p.trim()
  if (!prompt) return null

  if (question.k === 'c') {
    const options = question.o
      .map((option) => option.trim())
      .filter(Boolean)
      .slice(0, MAX_OPTIONS)
    if (options.length === 0) return null
    return { p: prompt, k: 'c', o: options, a: '' }
  }

  // Text and date questions carry no options; sending an empty array would be
  // dead weight in a payload measured in URL characters.
  return { p: prompt, k: question.k, a: '' }
}

/**
 * The sender's view: build a card and turn it into a link.
 *
 * The draft lives here rather than in <App/> because it is not a card yet --
 * nothing is committed to the URL until "Generate link" is pressed.
 */
export default function CardCreator() {
  const [delivery, setDelivery] = useState(DEFAULT_DELIVERY)
  const [questions, setQuestions] = useState(() => [createEmptyQuestion()])
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [tooLong, setTooLong] = useState(false)

  const ready = useMemo(() => questions.map(finalize).filter(Boolean), [questions])
  const canGenerate = ready.length === questions.length && ready.length > 0

  function reset() {
    setGeneratedUrl('')
    setTooLong(false)
  }

  function update(index, next) {
    setQuestions((current) => current.map((question, i) => (i === index ? next : question)))
    reset()
  }

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) return
    setQuestions((current) => [...current, createEmptyQuestion()])
    reset()
  }

  function removeQuestion(index) {
    if (questions.length <= 1) return
    setQuestions((current) => current.filter((_, i) => i !== index))
    reset()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!canGenerate) return

    // Refuse a card whose *answered* form would not survive the return trip,
    // rather than letting the recipient hit the wall instead.
    const card = { t: delivery, q: ready }
    if (projectedAnsweredLength(card) > URL_LENGTH_HARD_MAX) {
      setGeneratedUrl('')
      setTooLong(true)
      return
    }

    // Answers start empty: that emptiness is what routes the recipient to the
    // viewer rather than the result.
    setTooLong(false)
    setGeneratedUrl(encodeState(card))
  }

  return (
    <Card>
      <p className="eyebrow">Ask, and get an answer back</p>
      {/* The single Bebas Neue hero surface for this fold. */}
      <h1 className="wordmark mt-2 text-4xl text-foreground">
        JUST <span className="gradient-accent">ASKING</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Build the questions, choose how the card arrives, and send the link. No accounts and no
        server &mdash; the whole card travels inside the URL.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <fieldset>
          <legend className="eyebrow">How it arrives</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            What the recipient sees before the questions.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {DELIVERIES.map((option) => (
              <label
                key={option.id}
                className={`cursor-pointer rounded-button border px-3 py-2 transition-colors ${
                  delivery === option.id
                    ? 'border-primary bg-surface-2'
                    : 'border-border bg-bg-sunken hover:border-border-strong'
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={option.id}
                  checked={delivery === option.id}
                  onChange={() => {
                    setDelivery(option.id)
                    reset()
                  }}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-foreground">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
              </label>
            ))}
          </div>

          <DeliveryPreview styleId={delivery} />
        </fieldset>

        <div className="space-y-3">
          {questions.map((question, index) => (
            // Index keys are acceptable here: removing a question rebuilds the
            // list from the parent's state and no row holds state of its own.
            <QuestionEditor
              key={index}
              question={question}
              index={index}
              total={questions.length}
              onChange={(next) => update(index, next)}
              onRemove={() => removeQuestion(index)}
            />
          ))}

          {questions.length < MAX_QUESTIONS ? (
            <button
              type="button"
              onClick={addQuestion}
              className="w-full rounded-button border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              + Add another question
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              That is the maximum of {MAX_QUESTIONS} questions &mdash; more would push the link
              past what chat apps carry reliably.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canGenerate}
          className="w-full rounded-button bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate link
        </button>
      </form>

      {tooLong ? (
        <div className="mt-6 rounded-button border border-destructive/60 bg-bg-sunken px-4 py-3 text-sm text-foreground">
          <p className="font-semibold">This card is too long to send as a link.</p>
          <p className="mt-1 text-muted-foreground">
            Once answered it would not fit in a URL that chat apps carry reliably. Shorten a
            prompt, drop an option, or remove a question.
          </p>
        </div>
      ) : null}

      {generatedUrl ? (
        <div className="mt-6 border-t border-border pt-6">
          <ShareLink
            url={generatedUrl}
            label="Send this link to them"
            hint="When they answer, they get a link to send back to you."
          />
        </div>
      ) : null}
    </Card>
  )
}
