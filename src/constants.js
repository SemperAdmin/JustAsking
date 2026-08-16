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
 * Role accents, from the Semper Admin style guide: four roles, four colours,
 * matched to the audience being addressed.
 *
 * A card's `t` value is one of these ids. It selects a `data-role` attribute
 * that re-points `--color-primary` in justasking.css, so a card can pick an
 * accent from this list but can never supply styling of its own.
 */
export const ROLES = [
  { id: 'marine', label: 'Marine', audience: 'Junior enlisted' },
  { id: 'leader', label: 'Leader', audience: 'NCO and SNCO' },
  { id: 'commander', label: 'Commander', audience: 'Officer' },
  { id: 'admin', label: 'Admin', audience: 'S-1 and admin' },
]

export const ROLE_IDS = ROLES.map((role) => role.id)

/** Scarlet is the brand primary, so the Marine accent is the default. */
export const DEFAULT_ROLE = ROLES[0].id
