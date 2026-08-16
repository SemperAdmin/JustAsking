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
 * Role accents, from the Semper Admin style guide: four roles, four colours,
 * matched to the audience being addressed.
 *
 * A card's `t` value is one of these ids. It selects a `data-role` attribute
 * that re-points `--color-primary` in justasking.css, so a card can pick an
 * accent from this list but can never supply styling of its own.
 */
export const ROLES = [
  {
    id: 'marine',
    label: 'Marine',
    audience: 'Junior enlisted',
  },
  {
    id: 'leader',
    label: 'Leader',
    audience: 'NCO and SNCO',
  },
  {
    id: 'commander',
    label: 'Commander',
    audience: 'Officer',
  },
  {
    id: 'admin',
    label: 'Admin',
    audience: 'S-1 and admin',
  },
]

export const ROLE_IDS = ROLES.map((role) => role.id)

/** Scarlet is the brand primary, so the Marine accent is the default. */
export const DEFAULT_ROLE = ROLES[0].id
