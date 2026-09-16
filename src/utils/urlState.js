import LZString from 'lz-string'

import {
  DEFAULT_KIND,
  DEFAULT_DELIVERY,
  KIND_IDS,
  MAX_OPTION_LENGTH,
  MAX_OPTIONS,
  MAX_PROMPT_LENGTH,
  MAX_QUESTIONS,
  MAX_TEXT_ANSWER_LENGTH,
  DELIVERY_IDS,
} from '../constants.js'

/**
 * The card payload is intentionally single-letter keyed. Every byte here becomes
 * two or three characters of URL after compression, and the whole point of the
 * app is that the card fits in a link somebody can paste into a text message.
 *
 *   t -> delivery style id    (string)
 *   q -> questions            (array, 1..MAX_QUESTIONS)
 *
 * and per question:
 *
 *   p -> prompt               (string)
 *   k -> kind                 ('c' choice | 'x' text | 'd' date | 'dt' date+time)
 *   o -> options              (string[], choice only)
 *   a -> answer               (string, empty until the recipient answers)
 */

export const EMPTY_QUESTION = {
  p: '',
  k: DEFAULT_KIND,
  o: ['Yes', 'No'],
  a: '',
}

/** A brand-new question, safe to push straight into the creator's draft. */
export function createEmptyQuestion() {
  return { ...EMPTY_QUESTION, o: [...EMPTY_QUESTION.o] }
}

/**
 * Force an arbitrary value into a bounded, single-line string.
 *
 * Anything arriving from the hash is attacker-controlled: a hand-crafted link
 * can carry numbers, objects, or megabytes of text where we expect a short
 * label. Non-strings are rejected outright and everything else is clipped, so
 * the rest of the app can treat the payload as ordinary text. React escapes it
 * on render, and we never touch dangerouslySetInnerHTML.
 */
function toSafeString(value, maxLength) {
  if (typeof value !== 'string') return ''
  // Collapse newlines and control characters so a payload can't fake layout.
  return value
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

/**
 * Check that a date string is both well-formed and a real calendar moment.
 *
 * The shape test alone would accept 2026-02-31. The parts are compared back
 * against a constructed date to reject anything that rolled over, and the date
 * is built from its components rather than parsed from the string, because
 * `new Date('2026-08-16')` is treated as UTC and lands on the previous day for
 * anyone west of Greenwich.
 */
function isRealDate(value, withTime) {
  if (!(withTime ? DATETIME_RE : DATE_RE).test(value)) return false

  const [datePart, timePart = '00:00'] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)

  if (hh > 23 || mm > 59) return false

  const probe = new Date(y, m - 1, d)
  return probe.getFullYear() === y && probe.getMonth() === m - 1 && probe.getDate() === d
}

/**
 * Normalize one decoded question. Returns null if it is not answerable.
 */
function sanitizeQuestion(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const prompt = toSafeString(raw.p, MAX_PROMPT_LENGTH)
  if (!prompt) return null

  const kind = KIND_IDS.includes(raw.k) ? raw.k : DEFAULT_KIND

  if (kind === 'c') {
    const options = (Array.isArray(raw.o) ? raw.o : [])
      .map((option) => toSafeString(option, MAX_OPTION_LENGTH))
      .filter((option) => option.length > 0)
      .slice(0, MAX_OPTIONS)

    // A choice with nothing to choose is not answerable.
    if (options.length === 0) return null

    // The answer only counts if it is one of the options actually offered. This
    // stops a tampered link from displaying a reply the recipient never gave.
    const claimed = toSafeString(raw.a, MAX_OPTION_LENGTH)
    return { p: prompt, k: kind, o: options, a: options.includes(claimed) ? claimed : '' }
  }

  if (kind === 'd' || kind === 'dt') {
    const claimed = toSafeString(raw.a, 32)
    // A malformed or impossible date is dropped rather than displayed. It would
    // render harmlessly as text, but it would still be a lie about what the
    // recipient picked.
    return { p: prompt, k: kind, a: isRealDate(claimed, kind === 'dt') ? claimed : '' }
  }

  return { p: prompt, k: kind, a: toSafeString(raw.a, MAX_TEXT_ANSWER_LENGTH) }
}

/**
 * Normalize a decoded payload into the exact shape the components expect.
 * Missing keys get defaults; junk keys are dropped.
 */
export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  // Links minted before cards could hold more than one question carried the
  // prompt as `q` and the options beside it. Lift that shape into a
  // single-question card so old links keep opening.
  const rawQuestions = Array.isArray(raw.q)
    ? raw.q
    : typeof raw.q === 'string'
      ? [{ p: raw.q, k: 'c', o: raw.o, a: raw.a }]
      : []

  const questions = rawQuestions
    .slice(0, MAX_QUESTIONS)
    .map(sanitizeQuestion)
    .filter(Boolean)

  // A card with nothing answerable in it is not a card.
  if (questions.length === 0) return null

  // An unrecognised style falls back rather than failing the card. Links minted
  // when `t` carried a theme name, and later a role accent, land here.
  const delivery = DELIVERY_IDS.includes(raw.t) ? raw.t : DEFAULT_DELIVERY

  return { t: delivery, q: questions }
}

/** True once every question on the card carries an answer. */
export function isComplete(card) {
  return Boolean(card) && card.q.every((question) => question.a !== '')
}

/**
 * High-entropy filler, used only to size the worst case a free-text answer
 * could reach. A repeated character would compress to nothing and make the
 * projection below far too optimistic.
 *
 * `seed` has to differ per question. The generator is deterministic, so calling
 * it with one seed for every free-text answer on a card produced the *same*
 * string five times over, and LZ-String collapses a repeat to a back-reference
 * costing a couple of characters. That made a five-question card project at
 * roughly a single question's worth of answer, and the creator would mint a
 * card whose real reply overran the ceiling it had promised to respect.
 */
function incompressible(length, seed = 1) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,'
  // A seed of 0 is a fixed point of the recurrence and would emit one repeated
  // character, so keep it away from zero.
  let state = (seed | 0) === 0 ? 1 : seed | 0
  let out = ''
  for (let i = 0; i < length; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    out += alphabet[state % alphabet.length]
  }
  return out
}

/**
 * Headroom on the projection, as a fraction.
 *
 * Even with a distinct seed per answer, the filler shares an alphabet across
 * questions, so LZ-String still finds a little structure between them that
 * genuinely unrelated answers would not offer. The projection therefore runs
 * slightly under the true worst case. This margin covers the gap rather than
 * pretending the estimate is exact.
 */
const PROJECTION_MARGIN = 0.12

/**
 * How long this card's link could get once every question is answered.
 *
 * The sender's link is only half the journey: the recipient adds their answers
 * and sends a longer link back. Measuring the *answered* form up front is what
 * lets the creator promise that a card it accepts can always make the return
 * trip -- rather than the recipient discovering at the end that their reply no
 * longer fits.
 */
export function projectedAnsweredLength(card) {
  const filled = {
    ...card,
    q: card.q.map((question, index) => {
      if (question.k === 'c') {
        // The longest option is the worst this answer can actually be.
        const longest = question.o.reduce((a, b) => (b.length > a.length ? b : a), '')
        return { ...question, a: longest }
      }
      if (question.k === 'd') return { ...question, a: '2026-12-31' }
      if (question.k === 'dt') return { ...question, a: '2026-12-31T23:59' }
      // Distinct filler per question. See the note on `incompressible`.
      return { ...question, a: incompressible(MAX_TEXT_ANSWER_LENGTH, index + 1) }
    }),
  }

  // Only free-text answers are estimated. Choice, date, and date-time answers
  // are drawn from content already in the payload, so their projection is exact
  // and needs no padding.
  const estimated = card.q.some((question) => question.k !== 'c' && question.k !== 'd' && question.k !== 'dt')
  const length = encodeState(filled).length
  return estimated ? Math.ceil(length * (1 + PROJECTION_MARGIN)) : length
}

/**
 * Serialize a card into a shareable absolute URL.
 *
 * JSON -> LZString -> URL-safe fragment. The fragment is used rather than a
 * query string so the payload is never sent to the host serving the page.
 */
export function encodeState(stateObject) {
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(stateObject))
  const { origin, pathname, search } = window.location
  return `${origin}${pathname}${search}#${compressed}`
}

/**
 * Parse a URL fragment back into a card.
 * Returns null for anything empty, corrupt, truncated, or hand-edited.
 */
export function decodeState(hash) {
  if (typeof hash !== 'string') return null

  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  if (!fragment) return null

  try {
    const json = LZString.decompressFromEncodedURIComponent(fragment)
    // lz-string signals garbage input with null or an empty string rather than
    // by throwing, so both have to be checked explicitly.
    if (!json) return null
    return sanitizeState(JSON.parse(json))
  } catch {
    // Truncated links (chat clients love to break long URLs) land here.
    return null
  }
}
