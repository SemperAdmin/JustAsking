import formatAnswer from '../utils/formatAnswer'
import { Card } from './Layout'

/**
 * Pick a display size for a single-question answer.
 *
 * The answer gets the guide's stat-tile treatment, which assumes something
 * short. Answers can run to 120 characters of free text, and Bebas Neue at
 * 56px runs off the side of a phone long before that, so the size steps down
 * as the answer grows. Short answers -- the common case, "Yes" -- still land at
 * full hero scale.
 */
function answerSize(answer) {
  if (answer.length <= 12) return 'text-6xl'
  if (answer.length <= 24) return 'text-5xl'
  if (answer.length <= 48) return 'text-4xl'
  return 'text-3xl'
}

/**
 * The sender's payoff: the answers that came back.
 *
 * A single-question card keeps the full hero reveal. Several questions become a
 * list -- stacking three hero numerals would leave nothing for the eye to land
 * on, and the guide allows only one display surface per fold anyway.
 */
export default function CardResult({ card, onReset }) {
  const single = card.q.length === 1

  return (
    <Card>
      <p className="eyebrow">{single ? 'You asked' : `You asked ${card.q.length} things`}</p>

      {single ? (
        <>
          <h1 className="mt-2 text-xl font-bold text-balance break-words text-foreground">
            {card.q[0].p}
          </h1>
          <div className="my-8 border-y border-border py-8 text-center">
            <p className="eyebrow">They said</p>
            <p
              className={`wordmark mt-3 break-words text-primary ${answerSize(
                formatAnswer(card.q[0]),
              )}`}
            >
              {formatAnswer(card.q[0])}
            </p>
          </div>
        </>
      ) : (
        <dl className="my-6 divide-y divide-border border-y border-border">
          {card.q.map((question, index) => (
            <div key={index} className="py-4">
              <dt className="text-sm font-semibold text-balance break-words text-muted-foreground">
                {question.p}
              </dt>
              <dd className="wordmark mt-1.5 text-3xl break-words text-primary">
                {formatAnswer(question)}
              </dd>
            </div>
          ))}
        </dl>
      )}

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
