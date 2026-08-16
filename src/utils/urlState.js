import LZString from 'lz-string'

import {
  DEFAULT_ROLE,
  MAX_ANSWER_LENGTH,
  MAX_OPTIONS,
  MAX_OPTION_LENGTH,
  MAX_QUESTION_LENGTH,
  ROLE_IDS,
} from '../constants.js'

/**
 * The card payload is intentionally single-letter keyed. Every byte here becomes
 * two or three characters of URL after compression, and the whole point of the
 * app is that the card fits in a link somebody can paste into a text message.
 *
 *   q -> question prompt      (string)
 *   t -> role accent id       (string)
 *   o -> response options     (string[])
 *   a -> selected answer      (string, empty until the recipient picks)
 */

export const EMPTY_STATE = {
  q: '',
  t: DEFAULT_ROLE,
  o: ['Yes', 'No'],
  a: '',
}

/** A brand-new card, safe to hand straight to <CardCreator/>. */
export function createEmptyState() {
  return { ...EMPTY_STATE, o: [...EMPTY_STATE.o] }
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

/**
 * Normalize a decoded payload into the exact shape the components expect.
 * Missing keys get defaults; junk keys are dropped.
 */
export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const question = toSafeString(raw.q, MAX_QUESTION_LENGTH)

  const options = (Array.isArray(raw.o) ? raw.o : [])
    .map((option) => toSafeString(option, MAX_OPTION_LENGTH))
    .filter((option) => option.length > 0)
    .slice(0, MAX_OPTIONS)

  // A card without a question or without anything to click is not answerable.
  if (!question || options.length === 0) return null

  // An unrecognised accent falls back rather than failing the card. Links
  // minted before the role accents replaced the old theme names land here.
  const role = ROLE_IDS.includes(raw.t) ? raw.t : DEFAULT_ROLE

  // The answer only counts if it is one of the options actually offered. This
  // stops a tampered link from displaying a reply the recipient never gave.
  const claimedAnswer = toSafeString(raw.a, MAX_ANSWER_LENGTH)
  const answer = options.includes(claimedAnswer) ? claimedAnswer : ''

  return { q: question, t: role, o: options, a: answer }
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
