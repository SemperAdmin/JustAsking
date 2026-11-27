# Branding, delivery styles and motion

Design decisions behind how JustAsking looks and how a card arrives. The
README has the summary; how the card is stored and validated is in
[DESIGN.md](DESIGN.md).

## Branding

The visual system is inherited, not owned. `src/styles/semper-tokens.css` is a
byte-for-byte mirror of the v1.2 token set in
[SemperAdminPortal](https://github.com/SemperAdmin/SemperAdminPortal) and is
treated as read-only: when a token changes it changes there and is re-mirrored
here, never the reverse. Everything specific to this app lives in
`src/styles/justasking.css` and is written in terms of those tokens rather than
in new hex values.

What that buys, from the style guide:

- **Dark navy by default**, light parchment as the secondary toggle. The choice
  is remembered per reader and is deliberately *not* encoded in the card URL —
  it is the reader's preference, not the sender's to impose.
- **One display surface per fold.** Bebas Neue is rare and load-bearing: the
  hero on the creator, and the answer on the result — sized like the guide's
  stat-tile numeral, stepping down as the answer gets longer. A multi-question
  card lists its answers instead: stacking hero numerals would leave nothing for
  the eye to land on. Questions stay in Inter, because a 160-character question
  set in condensed all-caps is not readable.
- **Self-hosted faces.** Inter, JetBrains Mono and Bebas Neue ship with the
  build, so there is no font request to a third party at runtime.

The one derived value is the admin green's dark-mode variant, which the guide
does not name. It is produced with `color-mix()` from `--color-role-admin`
rather than hardcoded, so it tracks the token instead of becoming a sixth hex
the style guide does not own.

## Delivery styles

The sender picks how the card arrives, and that is what the recipient meets
before any question appears:

| `t` | Style | Signature | Runs for |
| --- | --- | --- | --- |
| `env` | Sealed dispatch | Wax cracks, flap swings, letter slides out | 1180ms |
| `stamp` | Stamped orders | A stamp lands hard and jolts the page | 940ms |
| `wire` | Field transmission | A scan line crosses a dark panel, signal bars find strength | 1020ms |
| `scroll` | Unrolled orders | The cord parts and the scroll unrolls between its rods | 1060ms |

Four distinct motion signatures — a hinge and slide, an impact, an electronic
scan, an unroll — so they read as different arrivals rather than recolours.

This slot used to hold a role accent (marine / leader / commander / admin). It
only ever re-pointed `--color-primary`, and the label was never shown to the
person receiving the card, so the meaning stayed in the sender's head. It was
borrowed from SemperAdminPortal, where the accent earns its place because the
portal has role-differentiated *content*; JustAsking has none, so it was
decoration wearing a semantic costume. The accent is now the brand primary
throughout.

The creator previews the selected style, so a sender is not choosing between
four things by name alone and first seeing the result when they open their own
link. Selecting a style replays it; arriving on the page does not, since an
animation nobody asked for on load is what the motion budget exists to prevent.
The preview holds its final frame rather than fading out — the end state is the
part worth seeing — and shares its scenery with the real delivery through
`DeliveryStage`, so the two cannot drift.

Scenery is sized in `cqw`, percent of the stage's own width, because the
creator's stage is smaller than the recipient's. With fixed sizes the seal came
out oversized in the preview and the stamp wrapped onto two lines there but one
at full size; a preview that is not to scale is worth less than no preview.

Each style declares its own duration in `constants.js`, and that number has to
stay in step with the CSS. Every animated element also declares `--dur`
alongside its animation, which is what lets the reduced-motion opt-in re-enable
all four sequences with a single rule instead of restating durations style by
style.

### The one motion exception

The recipient's card arrives sealed. Breaking the wax cracks the seal, swings
the flap back, and slides the letter up out of the envelope — about **1.2s**,
against the guide's §8 cap of 240ms and its "no page-transition theater"
principle.

The envelope is built from four stacked pieces — back panel, letter, front
panel, flap — so the letter has somewhere to come from. Without that the flap
opened onto a blank slab and nothing appeared to leave the envelope, which is
the difference between motion and a state change.

This is a deliberate exception, recorded here rather than quietly taken. The
argument for it:

- The cap exists for **incidental** motion — route changes and chrome, things
  standing between a reader and what they came for. This is not incidental. It
  is the single beat the product exists for: someone was asked something.
- It is **user-initiated**. Nothing animates on arrival; the sequence runs only
  when the recipient taps "Break the seal".
- It happens **once**, on one view, and never on the sender's side.

Everything else in the app stays inside the budget.

#### It also overrides `prefers-reduced-motion`

The sequence plays by default for everyone, including devices asking for
reduced motion. This is the product owner's call, taken knowingly, and it is
the part of this app most worth revisiting.

The case for it: most people with the setting on have it on for battery or
taste, this is one user-initiated beat rather than motion imposed on the way
somewhere, and the seal is the product's only moment of delight.

The case against it, which is not nothing: the setting also exists for people
whose vestibular disorders or migraines are triggered by animation, and for
them a media query is not a preference but an accommodation. Overriding it by
default is normally poor practice, and it is worth changing your mind about if
anyone ever reports feeling ill.

So it is an override, not a dismissal. A reader whose device asked for less
motion is told the card animates and given one tap to turn it off, and that
choice is remembered in `localStorage` so they never sit through it twice.
Readers who did not ask for reduced motion are shown no control at all.

Letting the sequence run on those devices takes some force: the brand token
mirror ships a universal
`*, *::before, *::after { animation-duration: 0.01ms !important }`. That rule
is correct as a default and the mirror is read-only, so it is beaten the only
way an `!important` on a universal selector can be — an `!important` on a more
specific one, in the `[data-motion='play']` block at the end of
`justasking.css`. Its durations are restated there and have to stay in step
with the sequence.

