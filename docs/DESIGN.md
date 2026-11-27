# Design notes

How JustAsking works and why it is built the way it is. The README has the summary; this file has the detail. Branding, delivery styles and the motion exception are in [BRAND-AND-MOTION.md](BRAND-AND-MOTION.md). Deployment detail is in [DEPLOYMENT.md](DEPLOYMENT.md).

## How it works

The app has no router. Which view you see is decided entirely by what is in
`window.location.hash`:

| Hash                          | View            | Who is looking               |
| ----------------------------- | --------------- | ---------------------------- |
| _(none)_                      | `<CardCreator/>`| The sender, building a card  |
| present, a question unanswered| `<CardViewer/>` | The recipient, answering     |
| present, all answered         | `<CardResult/>` | The sender, seeing the replies |

The round trip is: sender generates a link → recipient opens it, plays out
whichever delivery the sender chose, and answers the questions **one at a time** → recipient copies the *new*
link the app generates → sender opens that and sees the answers.

Questions are presented singly rather than as a form. A card is a conversation,
not paperwork, and a stack of prompts reads as the latter. A choice advances
itself on tap — the tap *is* the answer; text and dates get an explicit Next,
having no natural completion. A review step at the end lists every answer with a
Change beside it. Nothing is transmitted to any server at any point; a URL
fragment is never sent in an HTTP request.

### Payload

Keys are single letters to keep the encoded link short:

```json
{
  "t": "env",
  "q": [
    { "p": "Will you attend the meeting?", "k": "c", "o": ["Yes", "No"], "a": "" },
    { "p": "When are you available?", "k": "dt", "a": "" }
  ]
}
```

- `t` — delivery style, one of `env`, `stamp`, `wire`, `scroll`
- `q` — 1 to 5 questions, each with:
  - `p` — the prompt (max 160 characters)
  - `k` — kind: `c` choice, `x` free text, `d` date, `dt` date and time
  - `o` — choice only: up to 6 options (max 40 characters each)
  - `a` — the answer; empty until the recipient answers

Every question must be answered before the recipient gets a reply link, and it
is that completeness — not any single field — that routes the sender to the
result.

Answers are validated by kind, not merely by length. A choice answer must be one
of the options the card actually offered; a date must be a real calendar date,
so `2026-02-31` is discarded rather than displayed.

That JSON is `JSON.stringify`'d, compressed with
`LZString.compressToEncodedURIComponent`, and written to the hash.

### Backward compatibility

`q` used to be a single string with `o` and `a` beside it. `t` has meant three
different things: a free-form theme name, then a role accent, now a delivery
style. Links minted under any of those still open — the old payload is lifted
into a one-question card, and an unrecognized `t` falls back to `env`.

### The URL budget

A card that can be sent must be able to come back — the recipient's reply is a
*longer* link than the one they received. So the creator measures the card's
**fully answered** form before minting anything, and refuses outright if that
would exceed 1900 characters.

The ceiling is enforced by measurement rather than by tightening the field
limits, because encoded length depends on content, not just character count.
Ordinary English compresses to roughly a third; an identifier or pasted token
barely compresses at all. Sizing every limit for the incompressible case would
punish normal senders for a case they never hit. Measured:

| Card | Answered length |
| --- | --- |
| The two-question example above | 220 |
| Realistic 5 questions, ordinary English | 655 |
| 5 questions, maximum fields, incompressible text | 3376 — **refused** |

Choice, date, and date-time answers are drawn from content already sitting in
the payload, so their projection is exact. A free-text answer does not exist
yet at projection time, and its filler necessarily shares an alphabet across
questions in a way genuinely unrelated answers would not, so a card carrying
any free-text question is projected with a 12% margin on top. `npm test`
asserts the invariant directly against randomised content: a card the creator
accepts always produces a reply inside the ceiling.

## Testing

Vitest with jsdom. Two files, covering the two places where a mistake is not
merely cosmetic.

`src/utils/urlState.test.js` covers the sanitizer, the decoder, and the URL
budget. This file holds the whole trust boundary of the app, so the tests are
adversarial: junk payloads, a choice answer that was never on the option list, a
date that passes the shape check but is not a real day, a truncated fragment,
and a legacy payload shape. The budget tests are randomised rather than fixed,
because a fixed fixture would have passed against the bug they now guard.

`src/App.test.jsx` drives the real round trip through a DOM and asserts that
pasting a second card into an open tab carries nothing across from the first.
That is a regression guard for a confirmed leak, not a hypothetical: the viewer
seeds its answers once at mount, so before the fragment became its key React
reused the mounted instance and offered to send one sender's private free-text
answer back to a different one. `<CardViewer key={cardKey}/>` in `App.jsx` is
load-bearing, and removing it turns this test red.

## Project layout

```
src/
├── App.jsx                    # reads the hash, picks the view
├── App.test.jsx               # end-to-end guard: no state crosses cards
├── constants.js               # limits, question kinds, delivery styles
├── index.css                  # imports tailwind, brand tokens, app layer
├── assets/
│   └── semper-mark.png        # emblem, cream backdrop keyed to transparency
├── styles/
│   ├── semper-tokens.css      # MIRROR of the v1.2 brand tokens — read-only
│   └── justasking.css         # this app's layer, in terms of those tokens
├── components/
│   ├── Layout.jsx             # page shell, header and footer
│   ├── BrandHeader.jsx        # emblem, wordmark, light/dark control
│   ├── BrandFooter.jsx        # scarlet rule, disclaimer, build stamp
│   ├── QuestionEditor.jsx     # one question in the creator's draft
│   ├── Delivery.jsx           # holds the questions until the reader opens it
│   ├── DeliveryStage.jsx      # the scenery, shared with the preview
│   ├── DeliveryPreview.jsx    # what the sender is choosing, to scale
│   ├── ShareLink.jsx          # read-only link field with copy button
│   ├── CardCreator.jsx        # build a card, generate a link
│   ├── CardViewer.jsx         # answer a card, generate the reply link
│   └── CardResult.jsx         # show the answer that came back
├── lib/
│   └── app-links.js           # external destinations, in one place
├── hooks/
│   ├── useColorScheme.js      # dark default, light toggle, persisted
│   └── useCopyToClipboard.js  # clipboard write with an execCommand fallback
└── utils/
    ├── formatAnswer.js        # renders stored answers, dates to locale
    ├── urlState.js            # encode / decode / sanitize the payload
    └── urlState.test.js       # sanitizer, decoder, and URL budget invariants
```

## Handling untrusted links

Everything in the hash is attacker-controlled — anyone can hand-craft a link —
so `sanitizeState()` in `src/utils/urlState.js` is the gate that all decoded
payloads pass through. It:

- rejects non-strings and coerces everything else to bounded, single-line text
- strips control characters, and clips text to the documented limits
- drops any question with no prompt, and any choice with no options — without
  sinking the rest of the card
- drops a card with nothing answerable left in it
- ignores an unrecognized role accent or kind and falls back
- **discards a choice answer that is not one of that question's own options**,
  so a tampered link cannot show the sender a reply the recipient never gave
- **discards a date that is not a real calendar date**, so a hand-edited link
  cannot claim someone picked 31 February

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

## Outbound links

Four links lead off the current card. None is a request the app makes on its
own; each opens only when the reader selects it, and nothing from the open card
(questions, answers or the address) travels with any of them. The page sends no
referrer.

- **Send feedback** in the footer opens an externally hosted form in a new tab.
  The destination is `FEEDBACK_URL` in `src/lib/app-links.js`, so a change is a
  one-line edit. It is on a .mil host, so a reader on a personal device or
  off-network may not be able to reach it. That is a property of the
  destination, not of this app.
- **How it works** in the footer, and the walkthrough card on the creator, link
  to a video on a .mil portal (`WALKTHROUGH` in `src/lib/app-links.js`). Both are
  a link, never an embed: an iframe would contact a third party on page load,
  before anyone asked for a video. The card shows a plain panel behind the play
  badge; a local poster image is optional (`hasPoster`) and has to stay local,
  because the deployed policy is `img-src 'self'`. The walkthrough appears on
  the creator only, since the recipient has one job and a tutorial is not it.
- The emblem in the header links to the Semper Admin Portal, in a new tab so the
  open card is not lost.
- **Make your own card**, on the recipient's review step, points at this app with
  no fragment. It opens in a new tab on purpose: the recipient's current tab
  holds a reply link that nothing else has a copy of.

Prefilling the feedback form with any card content would hand somebody's card to
a third party, which is the one promise this app makes, so it is not done.
