import { Card } from './Layout'

/**
 * The sender's payoff: the answer that came back.
 */
export default function CardResult({ card, onReset }) {
  return (
    <Card className="text-center">
      <p className="text-sm font-medium text-muted">You asked</p>
      <h1 className="mt-1 text-xl font-semibold text-balance text-ink sm:text-2xl">{card.q}</h1>

      <div className="my-8">
        <p className="text-sm font-medium text-muted">They said</p>
        <p className="mt-2 text-4xl font-extrabold text-balance text-accent sm:text-5xl">{card.a}</p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
      >
        Create a new JustAsking card
      </button>
    </Card>
  )
}
