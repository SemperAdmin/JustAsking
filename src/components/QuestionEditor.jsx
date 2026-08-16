import { KINDS, MAX_OPTIONS, MAX_OPTION_LENGTH, MAX_PROMPT_LENGTH, MIN_OPTIONS } from '../constants'

/**
 * One question in the creator's draft: prompt, kind, and -- for a choice --
 * the options offered.
 *
 * Entirely controlled. The parent owns the draft array; this only reports
 * changes back through `onChange`.
 */
export default function QuestionEditor({ question, index, total, onChange, onRemove }) {
  const set = (patch) => onChange({ ...question, ...patch })

  function setOption(optionIndex, value) {
    set({ o: question.o.map((option, i) => (i === optionIndex ? value : option)) })
  }

  return (
    <div className="rounded-button border border-border bg-bg-sunken p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">Question {index + 1}</p>
        {total > 1 ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove question ${index + 1}`}
            className="rounded-button border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            Remove
          </button>
        ) : null}
      </div>

      <textarea
        value={question.p}
        maxLength={MAX_PROMPT_LENGTH}
        rows={2}
        onChange={(event) => set({ p: event.target.value })}
        placeholder={index === 0 ? 'Will you attend the meeting?' : 'When are you available?'}
        aria-label={`Question ${index + 1} prompt`}
        className="mt-2 w-full resize-none rounded-button border border-input bg-card px-3 py-2 text-foreground placeholder:text-subtle-foreground"
      />
      <p className="mt-1 text-right font-mono text-xs text-subtle-foreground">
        {question.p.length}/{MAX_PROMPT_LENGTH}
      </p>

      <div className="mt-2">
        <label
          htmlFor={`kind-${index}`}
          className="eyebrow block"
        >
          Answer type
        </label>
        <select
          id={`kind-${index}`}
          value={question.k}
          onChange={(event) => set({ k: event.target.value })}
          className="mt-1 w-full rounded-button border border-input bg-card px-3 py-2 text-foreground"
        >
          {KINDS.map((kind) => (
            <option key={kind.id} value={kind.id}>
              {kind.label} &mdash; {kind.hint}
            </option>
          ))}
        </select>
      </div>

      {/* Options belong to choice questions only; the other kinds carry no
       * options at all, so the editor for them is simply absent. */}
      {question.k === 'c' ? (
        <fieldset className="mt-3">
          <legend className="eyebrow">Options</legend>
          <div className="mt-1.5 space-y-1.5">
            {question.o.map((option, optionIndex) => (
              // Index keys are safe here: rows have no internal state of their
              // own and the value is fully controlled by `question.o`.
              <div key={optionIndex} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  maxLength={MAX_OPTION_LENGTH}
                  onChange={(event) => setOption(optionIndex, event.target.value)}
                  placeholder={`Option ${optionIndex + 1}`}
                  aria-label={`Question ${index + 1} option ${optionIndex + 1}`}
                  className="w-full min-w-0 rounded-button border border-input bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-subtle-foreground"
                />
                <button
                  type="button"
                  onClick={() => set({ o: question.o.filter((_, i) => i !== optionIndex) })}
                  disabled={question.o.length <= MIN_OPTIONS}
                  aria-label={`Remove question ${index + 1} option ${optionIndex + 1}`}
                  className="shrink-0 rounded-button border border-border px-2.5 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {question.o.length < MAX_OPTIONS ? (
            <button
              type="button"
              onClick={() => set({ o: [...question.o, ''] })}
              className="mt-1.5 rounded-button border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              + Add option
            </button>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  )
}
