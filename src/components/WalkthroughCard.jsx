import emblem from "../assets/semper-mark.png";
import {
  WALKTHROUGH,
  hasWalkthrough,
  walkthroughPosterSrc,
} from "../lib/app-links";

/**
 * The poster half of the row: the sender's still if one has been supplied,
 * otherwise a plain panel.
 *
 * The fallback carries no mark of its own. The emblem was tried there and the
 * play badge sits centred on top of it, so the two collided into something that
 * read as clutter rather than as a thumbnail. An empty panel behind the badge
 * reads as "video, no still yet", which is exactly what it is.
 *
 * It exists so the walkthrough can go live the moment there is a URL, without
 * waiting on artwork, and so a missing file never shows a broken image.
 */
function Poster() {
  if (WALKTHROUGH.hasPoster) {
    return (
      <img
        src={walkthroughPosterSrc()}
        alt=""
        className="size-full object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <div className="size-full bg-surface-2" />;
}

/**
 * Invitation to the how-to video, shown to the sender.
 *
 * A link and a poster, never an embed. An iframe would contact a third party on
 * page load -- before anyone asked for a video -- on a page whose footer
 * promises nothing is stored. This costs no network at all until the tap.
 *
 * It is on the creator only. The recipient has one job, and a tutorial is not
 * it; they reach this through "Make your own card" if they want it.
 *
 * Renders nothing until a URL is configured, so a half-set-up build shows no
 * feature rather than a dead link.
 */
export default function WalkthroughCard() {
  if (!hasWalkthrough()) return null;

  return (
    <a
      href={WALKTHROUGH.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex items-center gap-3 rounded-button border border-border bg-bg-sunken p-2 transition-colors hover:border-primary"
    >
      <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xs border border-border">
        <Poster />
        {/* Play badge, drawn rather than shipped as another asset. */}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-7 place-items-center rounded-chip bg-primary/90 shadow-sm">
            <svg
              viewBox="0 0 12 12"
              aria-hidden="true"
              className="ml-0.5 size-3 fill-primary-foreground"
            >
              <path d="M2 1.2v9.6L10.5 6z" />
            </svg>
          </span>
        </span>
      </span>

      <span className="min-w-0">
        <span className="eyebrow block">New here?</span>
        <span className="mt-1 block text-sm font-semibold text-foreground">
          Watch the walkthrough
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {WALKTHROUGH.length ? `${WALKTHROUGH.length} · ` : ""}Opens in a new
          tab
        </span>
      </span>
    </a>
  );
}
