/**
 * Input limits. These exist to keep the compressed hash comfortably under the
 * ~2000 character ceiling that the least generous browsers and chat clients
 * enforce on a single URL.
 */
export const MAX_QUESTION_LENGTH = 200
export const MAX_OPTION_LENGTH = 50
export const MAX_ANSWER_LENGTH = MAX_OPTION_LENGTH
export const MIN_OPTIONS = 1
export const MAX_OPTIONS = 6

/** Warn the sender before a link gets long enough for clients to mangle it. */
export const URL_LENGTH_WARN_AT = 1800

/**
 * Themes are pure presentation. Each id maps to a `data-theme` value that
 * src/themes.css resolves into CSS custom properties, so a card can never
 * inject styling of its own -- it can only pick from this list.
 */
export const THEMES = [
  {
    id: 'default',
    label: 'Default',
    description: 'Clean and friendly',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    description: 'Soft pinks, for the nervous ask',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Understated, for work',
  },
  {
    id: 'playful',
    label: 'Playful',
    description: 'Bright and loud',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Dark and quiet',
  },
]

export const THEME_IDS = THEMES.map((theme) => theme.id)
