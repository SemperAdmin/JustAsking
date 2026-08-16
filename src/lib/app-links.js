/**
 * External links surfaced in the app UI, kept in one place so a destination
 * change is a one-line edit. Mirrors the same file in SemperScribe.
 */

/**
 * Where every "Send feedback" control points. An externally hosted form -- the
 * app itself makes no network calls; this only opens a new tab.
 *
 * Nothing about the open card is ever attached to it. Prefilling the form with
 * the question, the answers, or even the current URL would hand the contents of
 * somebody's card to a third party, which is the one promise this app makes.
 */
export const FEEDBACK_URL = 'https://forms.osi.apps.mil/r/k5QWzJDL9P'

/**
 * This app, with no card in the fragment.
 *
 * Computed rather than hardcoded so it stays correct wherever the build is
 * hosted -- a project page under /JustAsking/, a root domain, or straight off
 * the filesystem.
 */
export function blankCardHref() {
  return `${window.location.pathname}${window.location.search}`
}
