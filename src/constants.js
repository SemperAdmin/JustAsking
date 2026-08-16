/**
 * Input limits.
 *
 * These exist to keep the compressed hash under the ~2000 character ceiling
 * that the least generous browsers and chat clients enforce on a single URL.
 * A card can now carry several questions, so the per-question budgets are
 * tighter than when it carried one: the worst case the limits allow is
 * measured, not assumed -- see the URL budget check in the README.
 */
export const MAX_QUESTIONS = 5
export const MAX_PROMPT_LENGTH = 160
export const MAX_OPTION_LENGTH = 40
export const MAX_TEXT_ANSWER_LENGTH = 120
export const MIN_OPTIONS = 1
export const MAX_OPTIONS = 6

/**
 * URL budget.
 *
 * WARN_AT is advisory. HARD_MAX is enforced: the creator will not mint a link
 * whose *fully answered* form would exceed it, so a card that can be sent can
 * always be sent back.
 *
 * The ceiling is enforced by measurement rather than by shrinking the field
 * limits, because how long a card encodes to depends on what is in it. Ordinary
 * English compresses to roughly a third; an identifier or a pasted token barely
 * compresses at all. Sizing the limits for the incompressible case would punish
 * every normal sender for a case they will never hit.
 */
export const URL_LENGTH_WARN_AT = 1400
export const URL_LENGTH_HARD_MAX = 1900

/**
 * Question kinds.
 *
 * `k` is stored as a short code because it repeats once per question and every
 * byte is URL. `input` is the native control the recipient gets -- native
 * pickers mean the date UI is the one the reader's own OS provides, which is
 * both better than anything hand-rolled and free.
 */
export const KINDS = [
  {
    id: 'c',
    label: 'Choice',
    hint: 'Pick one of your options',
  },
  {
    id: 'x',
    label: 'Free text',
    hint: 'Type an answer',
    input: 'text',
  },
  {
    id: 'd',
    label: 'Date',
    hint: 'Pick a day',
    input: 'date',
  },
  {
    id: 'dt',
    label: 'Date & time',
    hint: 'Pick a day and time',
    input: 'datetime-local',
  },
]

export const KIND_IDS = KINDS.map((kind) => kind.id)
export const DEFAULT_KIND = 'c'

/** Look up a kind by its stored code. */
export function kindOf(id) {
  return KINDS.find((kind) => kind.id === id) ?? KINDS[0]
}

/**
 * Delivery styles.
 *
 * How the card presents itself to the recipient before the questions appear.
 * This replaced a role accent (marine / leader / commander / admin) that only
 * ever changed a colour and was never shown to the person receiving the card --
 * the meaning stayed in the sender's head. A delivery style changes something
 * the recipient actually experiences.
 *
 * `ms` is how long that style's CSS sequence runs before the questions take
 * over, and must stay in step with the animations in justasking.css.
 */
export const DELIVERIES = [
  {
    id: 'env',
    label: 'Sealed dispatch',
    hint: 'Wax seal, envelope, letter slides out',
    action: 'Break the seal',
    ms: 1180,
  },
  {
    id: 'stamp',
    label: 'Stamped orders',
    hint: 'A stamp comes down hard on the page',
    action: 'Open the orders',
    ms: 940,
  },
  {
    id: 'wire',
    label: 'Field transmission',
    hint: 'Arrives over the net, scanned in',
    action: 'Receive traffic',
    ms: 1020,
  },
  {
    id: 'scroll',
    label: 'Unrolled orders',
    hint: 'A tied scroll unrolls',
    action: 'Cut the cord',
    ms: 1060,
  },
]

export const DELIVERY_IDS = DELIVERIES.map((delivery) => delivery.id)

/** The envelope is the original, and the one most people will expect. */
export const DEFAULT_DELIVERY = 'env'

/** Look up a delivery by its stored code. */
export function deliveryOf(id) {
  return DELIVERIES.find((delivery) => delivery.id === id) ?? DELIVERIES[0]
}
