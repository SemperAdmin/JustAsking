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

/**
 * The how-to walkthrough.
 *
 * Follows the convention the portal settled on after its 2026-08 video audit:
 * the video itself lives on one canonical host, the app stores only a link and
 * a local poster. That audit's finding was "three conventions for the same
 * asset -- pick one canonical host", so there is exactly one `url` here and
 * every walkthrough control in the app reads it.
 *
 * Nothing is embedded. An iframe would contact a third party on page load,
 * before anyone asked for a video, on a page whose footer promises nothing is
 * stored. A poster and a link cost no network at all until the tap.
 *
 * To switch this on:
 *   1. set `url` to the published video
 *   2. drop a 16:9 still at `public/walkthrough-poster.jpg`
 *   3. set `hasPoster` to true
 *
 * With `url` empty every walkthrough control renders nothing, so a half-
 * configured build simply does not show the feature rather than shipping a
 * dead link.
 */
export const WALKTHROUGH = {
  url: '',
  hasPoster: false,
  posterFile: 'walkthrough-poster.jpg',
  /** Shown to set expectations before a tap. Omitted from the copy if empty. */
  length: '',
}

/** True once the walkthrough has somewhere to point. */
export function hasWalkthrough() {
  return WALKTHROUGH.url.trim().length > 0
}

/**
 * The poster's URL, resolved against the deployed base so it is correct under
 * a project path, a domain root, or straight off the filesystem.
 */
export function walkthroughPosterSrc() {
  return `${import.meta.env.BASE_URL}${WALKTHROUGH.posterFile}`
}
