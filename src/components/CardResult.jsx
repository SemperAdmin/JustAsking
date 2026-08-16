import { Card } from './Layout'

/**
 * Pick a display size for the answer.
 *
 * The answer gets the guide's stat-tile treatment, which assumes a short
 * numeral. Options are allowed up to 50 characters, and Bebas Neue at 56px
 * runs off the side of a phone long before that, so the size steps down as the
 * answer grows. Short answers -- the common case, "Yes" -- still land at full
 * hero scale.
 */
function answerSize(answer) {
  if (answer.length <= 12) return 'text-6xl'
  if (answer.length <= 24) return 'text-5xl'
  return 'text-4xl'
}

/**
 * The sender's payoff: the answer that came back.
 *
 * The answer is the one Bebas Neue surface in this fold; the question above it
 * stays in the body face.
 */
export default function CardResult({ card, onReset }) {
  return (
    <Card>
      <p className="eyebrow">You asked</p>
      <h1 className="mt-2 text-xl font-bold text-balance break-words text-foreground">{card.q}</h1>

      <div className="my-8 border-y border-border py-8 text-center">
        <p className="eyebrow">They said</p>
        <p className={`wordmark mt-3 break-words text-primary ${answerSize(card.a)}`}>{card.a}</p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-button bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Create a new card
      </button>
    </Card>
  )
}
