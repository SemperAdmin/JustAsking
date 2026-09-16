import emblem from '../assets/semper-mark.png'
import { PORTAL_URL } from '../lib/app-links'

/**
 * Brand chrome: the emblem and the SEMPER ADMIN wordmark, plus the
 * light/dark control.
 *
 * The emblem links out to the Semper Admin portal in a new tab. The link's
 * accessible name comes from the image alt, since the image is its only
 * content.
 *
 * The wordmark uses the display face at chrome scale, which leaves the one
 * permitted Bebas Neue hero surface per fold free for the view below.
 */
export default function BrandHeader({ scheme, onToggleScheme }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <a
          href={PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 rounded-button transition-opacity hover:opacity-80"
        >
          <img
            src={emblem}
            alt="Semper Admin portal"
            width={44}
            height={44}
            className="size-11 object-contain"
          />
        </a>
        <div>
          <p className="wordmark text-base text-foreground">SEMPER ADMIN</p>
          <p className="eyebrow mt-0.5">Just Asking</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleScheme}
        aria-pressed={scheme === 'light'}
        className="rounded-button border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
      >
        {scheme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </header>
  )
}
