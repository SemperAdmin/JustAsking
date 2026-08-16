import { useRef } from 'react'

import { URL_LENGTH_WARN_AT } from '../constants'
import useCopyToClipboard from '../hooks/useCopyToClipboard'

/**
 * Read-only link field with a copy button.
 *
 * Shared by the creator ("send this to them") and the viewer ("send this
 * back"), because in both cases the whole product is a URL on a clipboard.
 */
export default function ShareLink({ url, label, hint }) {
  const inputRef = useRef(null)
  const { copy, status } = useCopyToClipboard()

  function handleCopy() {
    copy(url)
    // Select the text too, so the copy is visible and a manual Ctrl+C still works
    // if the clipboard API was blocked.
    inputRef.current?.select()
  }

  const tooLong = url.length > URL_LENGTH_WARN_AT

  return (
    <div className="space-y-2">
      {label ? <label className="block text-sm font-medium text-ink">{label}</label> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
          aria-label={label || 'Shareable link'}
          className="w-full min-w-0 rounded-lg border border-edge bg-page px-3 py-2 font-mono text-xs text-ink"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
        >
          {status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed' : 'Copy link'}
        </button>
      </div>

      {/* Announce the copy result rather than relying on the button label alone. */}
      <p aria-live="polite" className="sr-only">
        {status === 'copied' ? 'Link copied to clipboard' : ''}
      </p>

      {status === 'error' ? (
        <p className="text-xs text-muted">
          Your browser blocked the clipboard. The link is selected above &mdash; copy it manually.
        </p>
      ) : null}

      {hint ? <p className="text-xs text-muted">{hint}</p> : null}

      {tooLong ? (
        <p className="text-xs text-muted">
          This link is {url.length} characters. Some chat apps break links that long &mdash; shortening
          your question or trimming an option will help.
        </p>
      ) : null}
    </div>
  )
}
