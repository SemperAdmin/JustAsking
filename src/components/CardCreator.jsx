import { useMemo, useState } from 'react'

import { MAX_OPTIONS, MAX_OPTION_LENGTH, MAX_QUESTION_LENGTH, MIN_OPTIONS, THEMES } from '../constants'
import { encodeState } from '../utils/urlState'
import { Card } from './Layout'
import ShareLink from './ShareLink'

/**
 * The sender's view: build a card and turn it into a link.
 *
 * The draft lives here rather than in <App/> because it is not a card yet --
 * nothing is committed to the URL until "Generate link" is pressed.
 */
export default function CardCreator({ onThemeChange }) {
  const [question, setQuestion] = useState('')
  const [theme, setTheme] = useState(THEMES[0].id)
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

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme)
    // Let <App/> repaint the page immediately so the picker doubles as a preview.
    onThemeChange?.(nextTheme)
    setGeneratedUrl('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!canGenerate) return

    // `a` starts empty: that emptiness is what routes the recipient to the viewer.
    setGeneratedUrl(
      encodeState({
        q: question.trim(),
        t: theme,
        o: trimmedOptions,
        a: '',
      }),
    )
  }

  return (
    <Card>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">JustAsking</h1>
        <p className="mt-1 text-sm text-muted">
          Write a question, pick the answers, and send the link. No accounts, no server &mdash; the
          whole card travels inside the URL.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-ink">
            Your question
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
            placeholder="Will you go to prom with me?"
            className="mt-1 w-full resize-none rounded-lg border border-edge bg-page px-3 py-2 text-ink placeholder:text-muted/70"
          />
          <p className="mt-1 text-right text-xs text-muted">
            {question.length} / {MAX_QUESTION_LENGTH}
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-ink">Theme</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEMES.map((option) => (
              <label
                key={option.id}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors ${
                  theme === option.id
                    ? 'border-accent bg-accent-soft'
                    : 'border-edge bg-page hover:border-accent'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.id}
                  checked={theme === option.id}
                  onChange={() => handleThemeChange(option.id)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-ink">{option.label}</span>
                <span className="block text-xs text-muted">{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-ink">Answer options</legend>
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
                  className="w-full min-w-0 rounded-lg border border-edge bg-page px-3 py-2 text-ink placeholder:text-muted/70"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= MIN_OPTIONS}
                  aria-label={`Remove answer option ${index + 1}`}
                  className="shrink-0 rounded-lg border border-edge px-3 text-muted transition-colors hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
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
              className="mt-2 rounded-lg border border-dashed border-edge px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-ink"
            >
              + Add option
            </button>
          ) : (
            <p className="mt-2 text-xs text-muted">
              That&rsquo;s the maximum of {MAX_OPTIONS} options.
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={!canGenerate}
          className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate link
        </button>
      </form>

      {generatedUrl ? (
        <div className="mt-6 border-t border-edge pt-6">
          <ShareLink
            url={generatedUrl}
            label="Send this link to them"
            hint="When they answer, they'll get a link to send back to you."
          />
        </div>
      ) : null}
    </Card>
  )
}
