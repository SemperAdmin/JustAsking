import { useMemo, useState } from 'react'

import {
  DEFAULT_ROLE,
  MAX_OPTIONS,
  MAX_OPTION_LENGTH,
  MAX_QUESTION_LENGTH,
  MIN_OPTIONS,
  ROLES,
} from '../constants'
import { encodeState } from '../utils/urlState'
import { Card } from './Layout'
import ShareLink from './ShareLink'

/**
 * The sender's view: build a card and turn it into a link.
 *
 * The draft lives here rather than in <App/> because it is not a card yet --
 * nothing is committed to the URL until "Generate link" is pressed.
 */
export default function CardCreator({ onRoleChange }) {
  const [question, setQuestion] = useState('')
  const [role, setRole] = useState(DEFAULT_ROLE)
  const [options, setOptions] = useState(['Yes', 'No'])
  const [generatedUrl, setGeneratedUrl] = useState('')

  const trimmedOptions = useMemo(
    () => options.map((option) => option.trim()).filter(Boolean),
    [options],
  )

  const canGenerate = question.trim().length > 0 && trimmedOptions.length >= MIN_OPTIONS

  function updateOption(index, value) {
    setOptions((current) => current.map((option, i) => (i === index ? value : option)))
    setGeneratedUrl('')
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return
    setOptions((current) => [...current, ''])
    setGeneratedUrl('')
  }

  function removeOption(index) {
    if (options.length <= MIN_OPTIONS) return
    setOptions((current) => current.filter((_, i) => i !== index))
    setGeneratedUrl('')
  }

  function handleRoleChange(nextRole) {
    setRole(nextRole)
    // Let <App/> repaint the accent immediately so the picker doubles as a preview.
    onRoleChange?.(nextRole)
    setGeneratedUrl('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!canGenerate) return

    // `a` starts empty: that emptiness is what routes the recipient to the viewer.
    setGeneratedUrl(
      encodeState({
        q: question.trim(),
        t: role,
        o: trimmedOptions,
        a: '',
      }),
    )
  }

  return (
    <Card>
      <p className="eyebrow">Ask one question</p>
      {/* The single Bebas Neue hero surface for this fold. */}
      <h1 className="wordmark mt-2 text-4xl text-foreground">
        JUST <span className="gradient-accent">ASKING</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Write the question, pick who you are asking, and send the link. No accounts and no
        server &mdash; the whole card travels inside the URL.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label htmlFor="question" className="eyebrow block">
            Question
          </label>
          <textarea
            id="question"
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            rows={3}
            onChange={(event) => {
              setQuestion(event.target.value)
              setGeneratedUrl('')
            }}
            placeholder="Can you cover the duty on Friday?"
            className="mt-2 w-full resize-none rounded-button border border-input bg-bg-sunken px-3 py-2 text-foreground placeholder:text-subtle-foreground"
          />
          <p className="mt-1 text-right font-mono text-xs text-subtle-foreground">
            {question.length}/{MAX_QUESTION_LENGTH}
          </p>
        </div>

        <fieldset>
          <legend className="eyebrow">Addressed to</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ROLES.map((option) => (
              <label
                key={option.id}
                data-role={option.id}
                className={`cursor-pointer rounded-button border px-3 py-2 transition-colors ${
                  role === option.id
                    ? 'border-primary bg-surface-2'
                    : 'border-border bg-bg-sunken hover:border-border-strong'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.id}
                  checked={role === option.id}
                  onChange={() => handleRoleChange(option.id)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-chip bg-primary"
                  />
                  <span className="text-sm font-semibold text-foreground">{option.label}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.audience}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow">Answers offered</legend>
          <div className="mt-2 space-y-2">
            {options.map((option, index) => (
              // Index keys are safe here: rows have no internal state of their own
              // and the value is fully controlled by `options`.
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  maxLength={MAX_OPTION_LENGTH}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  aria-label={`Answer option ${index + 1}`}
                  className="w-full min-w-0 rounded-button border border-input bg-bg-sunken px-3 py-2 text-foreground placeholder:text-subtle-foreground"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= MIN_OPTIONS}
                  aria-label={`Remove answer option ${index + 1}`}
                  className="shrink-0 rounded-button border border-border px-3 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {options.length < MAX_OPTIONS ? (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 rounded-button border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              + Add option
            </button>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              That is the maximum of {MAX_OPTIONS} options.
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={!canGenerate}
          className="w-full rounded-button bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate link
        </button>
      </form>

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
