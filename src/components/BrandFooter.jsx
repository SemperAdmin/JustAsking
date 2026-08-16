/**
 * Footer, following the portal's pattern: scarlet rule, wordmark, the standing
 * disclaimer, and the build stamp in mono.
 *
 * The middle column states this app's own posture rather than the portal's
 * "verify before action" line. JustAsking has no server and no store, which is
 * the thing a reader most needs to know before sending a card to somebody.
 */
export default function BrandFooter({ version, buildDate }) {
  return (
    <footer role="contentinfo" className="mt-10 w-full border-t border-border pt-6">
      <div className="brand-rule mb-5" aria-hidden="true" />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="wordmark text-lg text-foreground">SEMPER ADMIN</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            Educational reference for the USMC administrative community. Not an official
            Department of the Navy or Marine Corps publication. Always verify with the source
            order before action.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="eyebrow">Build</p>
            <p className="mt-1 font-mono text-sm text-foreground">{buildDate}</p>
            <p className="font-mono text-xs text-muted-foreground">{version}</p>
          </div>
          <div>
            <p className="eyebrow">Data posture</p>
            <p className="mt-1 text-sm font-semibold text-status-fresh">Nothing is stored</p>
            <p className="text-xs text-muted-foreground">
              The whole card travels inside the link.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 border-t border-border pt-3 text-xs text-subtle-foreground">
        &copy; {new Date().getFullYear()} Semper Admin. Open-source educational reference.
      </p>
    </footer>
  )
}
