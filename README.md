# JustAsking

Ask someone a question, send them a link, get their answer back. No accounts, no
database, no backend — the entire card is encoded into the URL fragment.

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
  "q": "Will you go to prom with me?",
  "t": "romantic",
  "o": ["Yes", "No"],
  "a": ""
}
```

- `q` — the question (max 200 characters)
- `t` — theme id, one of `default`, `romantic`, `professional`, `playful`, `midnight`
- `o` — up to 6 answer options (max 50 characters each)
- `a` — the selected answer; empty until the recipient picks one

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

## Project layout

```
src/
├── App.jsx                    # reads the hash, picks the view
├── constants.js               # input limits and the theme list
├── themes.css                 # one CSS custom-property palette per theme
├── components/
│   ├── Layout.jsx             # themed page shell + card panel
│   ├── ShareLink.jsx          # read-only link field with copy button
│   ├── CardCreator.jsx        # build a card, generate a link
│   ├── CardViewer.jsx         # answer a card, generate the reply link
│   └── CardResult.jsx         # show the answer that came back
├── hooks/
│   └── useCopyToClipboard.js  # clipboard write with an execCommand fallback
└── utils/
    └── urlState.js            # encode / decode / sanitize the payload
```

## Handling untrusted links

Everything in the hash is attacker-controlled — anyone can hand-craft a link —
so `sanitizeState()` in `src/utils/urlState.js` is the gate that all decoded
payloads pass through. It:

- rejects non-strings and coerces everything else to bounded, single-line text
- strips control characters, and clips text to the documented limits
- drops a card with no question or no options, rather than rendering a blank one
- ignores an unrecognized theme id and falls back to `default`
- **discards an `a` value that is not one of the card's own options**, so a
  tampered link cannot show the sender a reply the recipient never gave

Rendered text is only ever passed to React as a child, never through
`dangerouslySetInnerHTML`, so markup in a payload displays as literal text.

A hash that fails to decode — the usual cause is a chat client truncating a long
link — falls back to the creator with a short explanation instead of a blank
screen.

## Caveats

This is a toy by design, and the design has consequences worth being clear
about: anyone holding the link can read the question and answer, and the
recipient can edit their own answer before sending it back. There is no
authentication because there is no server. Don't use it for anything that needs
to be private or verifiable.
