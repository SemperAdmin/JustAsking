# JustAsking

A Semper Admin app. Ask someone a question, send them a link, get their answer
back. No accounts, no database, no backend — the entire card is encoded into the
URL fragment.

## How it works

The app has no router. Which view you see is decided entirely by what is in
`window.location.hash`:

| Hash                     | View            | Who is looking            |
| ------------------------ | --------------- | ------------------------- |
| _(none)_                 | `<CardCreator/>`| The sender, building a card |
| present, `a` empty       | `<CardViewer/>` | The recipient, answering  |
| present, `a` populated   | `<CardResult/>` | The sender, seeing the reply |

The round trip is: sender generates a link → recipient opens it and picks an
answer → recipient copies the *new* link the app generates → sender opens that
and sees the answer. Nothing is transmitted to any server at any point; a URL
fragment is never sent in an HTTP request.

### Payload

Keys are single letters to keep the encoded link short:

```json
{
  "q": "Can you cover the duty on Friday?",
  "t": "leader",
  "o": ["Yes", "No"],
  "a": ""
}
```

- `q` — the question (max 200 characters)
- `t` — role accent, one of `marine`, `leader`, `commander`, `admin`
- `o` — up to 6 answer options (max 50 characters each)
- `a` — the selected answer; empty until the recipient picks one

`t` used to carry free-form theme names. Links minted before the rebrand still
open — an unrecognized accent falls back to `marine` rather than failing the
card.

That JSON is `JSON.stringify`'d, compressed with
`LZString.compressToEncodedURIComponent`, and written to the hash. A typical
card lands around 140 characters of URL; the absolute worst case the input
limits allow is under 300, well inside every browser and chat client's ceiling.

## Getting started

```bash
npm install
npm run dev      # dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

The build uses relative asset paths, so `dist/` can be dropped on any static
host — or opened straight from the filesystem.

## Deployment

Live at <https://semperadmin.github.io/JustAsking/>, published by
`.github/workflows/deploy.yml` on every push to `main`.

**Settings → Pages → Source must be set to "GitHub Actions."** This is not
optional and is easy to get wrong, because the alternative setting looks like it
should work. With "Deploy from a branch → main → /(root)", GitHub publishes the
repository files verbatim, and the root `index.html` is Vite's entry point — it
points at `/src/main.jsx`, which is JSX the browser cannot execute. The result
is a blank page.

Worse, that setting is not merely wrong but actively competing: both builders
run on each push, and GitHub's branch builder tends to finish last and overwrite
the built site. The workflow reports success either way, so the Actions tab
looks healthy while the published site is wrong. If a deploy ever appears to
succeed but the live page is blank, check this setting first — a
`pages build and deployment` run in the Actions tab means it has reverted.

## Project layout

```
src/
├── App.jsx                    # reads the hash, picks the view
├── constants.js               # input limits and the role accents
├── index.css                  # imports tailwind, brand tokens, app layer
├── assets/
│   └── semper-mark.png        # emblem, cream backdrop keyed to transparency
├── styles/
│   ├── semper-tokens.css      # MIRROR of the v1.2 brand tokens — read-only
│   └── justasking.css         # this app's layer, in terms of those tokens
├── components/
│   ├── Layout.jsx             # page shell, applies the role accent
│   ├── BrandHeader.jsx        # emblem, wordmark, light/dark control
│   ├── BrandFooter.jsx        # scarlet rule, disclaimer, build stamp
│   ├── ShareLink.jsx          # read-only link field with copy button
│   ├── CardCreator.jsx        # build a card, generate a link
│   ├── CardViewer.jsx         # answer a card, generate the reply link
│   └── CardResult.jsx         # show the answer that came back
├── hooks/
│   ├── useColorScheme.js      # dark default, light toggle, persisted
│   └── useCopyToClipboard.js  # clipboard write with an execCommand fallback
└── utils/
    └── urlState.js            # encode / decode / sanitize the payload
```

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
- **Role accents.** Four roles, four colours, matched to the audience. The
  sender picks who they are addressing and the card carries that accent. Every
  component reads `--color-primary`, so none of them know roles exist.
- **One display surface per fold.** Bebas Neue is rare and load-bearing: the
  hero on the creator, and the answer on the result — sized like the guide's
  stat-tile numeral, stepping down as the answer gets longer. Questions stay in
  Inter, because a 200-character question set in condensed all-caps is not
  readable.
- **Self-hosted faces.** Inter, JetBrains Mono and Bebas Neue ship with the
  build, so there is no font request to a third party at runtime.

The one derived value is the admin green's dark-mode variant, which the guide
does not name. It is produced with `color-mix()` from `--color-role-admin`
rather than hardcoded, so it tracks the token instead of becoming a sixth hex
the style guide does not own.

## Handling untrusted links

Everything in the hash is attacker-controlled — anyone can hand-craft a link —
so `sanitizeState()` in `src/utils/urlState.js` is the gate that all decoded
payloads pass through. It:

- rejects non-strings and coerces everything else to bounded, single-line text
- strips control characters, and clips text to the documented limits
- drops a card with no question or no options, rather than rendering a blank one
- ignores an unrecognized role accent and falls back to `marine`
- **discards an `a` value that is not one of the card's own options**, so a
  tampered link cannot show the sender a reply the recipient never gave

Rendered text is only ever passed to React as a child, never through
`dangerouslySetInnerHTML`, so markup in a payload displays as literal text.

A hash that fails to decode — the usual cause is a chat client truncating a long
link — falls back to the creator with a short explanation instead of a blank
screen.

## Caveats

Putting the card in the URL is what makes this work without a backend, and it
is also the whole of its threat model. Be clear-eyed about it:

- **The link is the data.** Anyone who holds it can read the question and the
  answer. Links leak — through chat backups, screenshots, browser history, and
  anyone the recipient forwards it to.
- **The answer is not attributable.** The recipient can edit their own reply
  before sending it back. `sanitizeState()` stops a reply that was never on the
  card's option list, but it cannot tell you *who* clicked, and nothing is
  signed. An answer here is a convenience, not a record.
- **No PII, no official business.** Do not put names, EDIPIs, medical or legal
  matters, or anything close to a formal request or endorsement into a card.
  This is a quick informal poll, not a system of record, and it is not a
  substitute for any process that has one.

There is no authentication because there is no server. That is a deliberate
trade, not an oversight — but it means the tool has to stay on the low-stakes
side of the line.
