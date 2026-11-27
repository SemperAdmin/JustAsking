# JustAsking

Lets you ask someone a short set of questions by sending them a link, and read their answers when the link comes back. Built for quick, informal polls among Marines.

**Live:** https://justasking.app.cloud.gov
**Also at:** https://semperadmin.github.io/JustAsking/

## What it does

- Builds a card of one to five questions: choice, free text, date, or date and time.
- Lets the sender pick how the card arrives (sealed dispatch, stamped orders, field transmission or unrolled orders) and previews it.
- Shows the recipient one question at a time, with a review step before they send back a reply link.
- Shows the sender the replies when the reply link is opened.
- Needs no account, database or server: the whole card is encoded in the link.

## Using it

Open the live site in a current browser. No account or CAC is needed. Write your questions, choose a delivery style and copy the link. The recipient opens the link, answers, and sends back the new link the app gives them. Opening that link shows you the answers.

Anyone who holds a link can read the questions and answers in it. Do not put names, EDIPIs, medical or legal matters, or anything that needs a formal record into a card. See [docs/DESIGN.md](docs/DESIGN.md).

## Privacy and security

- Nothing you enter is sent to a server. The card lives in the part of the link after the `#`, which browsers never send in a request. The app makes no network requests of its own; its Content Security Policy sets `connect-src 'none'` and the default source to `'none'`.
- Three links in the page lead off the site and open only when you select them, in a new tab, with nothing from your card attached: **Send feedback** (an external form that needs a .mil network), **How it works** (a walkthrough video on a .mil portal, also needs a .mil network), and the emblem in the header (the Semper Admin Portal).
- The browser stores only two preferences in `localStorage`: your light or dark colour scheme and your choice to play or skip the card-opening animation. No cookies, analytics or fonts from other sites.
- The delivery animation plays even when a device asks for reduced motion; a reader whose device asks for less motion is offered a one-tap way to turn it off. See [docs/BRAND-AND-MOTION.md](docs/BRAND-AND-MOTION.md).
- The hosting platforms (cloud.gov and GitHub Pages) keep standard web server access logs, such as IP address, time, requested page and browser type, for operations and security. Semper Admin does not add tracking of its own.

See [Security](SECURITY.md).

## Development

Requires Node.js 22 (the version the workflows use) and npm.

```bash
npm ci
npm run dev
npm test
npm run build
npm run verify:deploy
```

`npm run verify:deploy` checks, before a cloud.gov push, that `dist/` holds a real build, that it is newer than the sources, and that every inline script in the built page is pinned by hash in the Content Security Policy.

`npm run preview` serves the production build and `npm run test:watch` re-runs the tests on change. The build uses relative asset paths, so the same `dist/` works on GitHub Pages, cloud.gov or straight from the filesystem.

## Deployment

| Environment | URL | How |
|---|---|---|
| cloud.gov | https://justasking.app.cloud.gov | `manifest.yml` (staticfile buildpack); manual **Deploy to cloud.gov** workflow; sandbox managed by the private cloudgov-redeploy repository |
| GitHub Pages | https://semperadmin.github.io/JustAsking/ | `.github/workflows/deploy.yml` on push to `main` |

GitHub Pages must be set to deploy from **GitHub Actions**, not from a branch. Details of what the cloud.gov push contains and the response headers are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentation

- [docs/DESIGN.md](docs/DESIGN.md): how the card travels in the link, the link size limit, handling untrusted links, outbound links and caveats.
- [docs/BRAND-AND-MOTION.md](docs/BRAND-AND-MOTION.md): branding, delivery styles and the motion exception.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): what gets pushed to cloud.gov and the response headers.

## Feedback and support

[Open an issue](https://github.com/SemperAdmin/JustAsking/issues), or use **Send feedback** in the app from a .mil network. Report security problems as described in [SECURITY.md](SECURITY.md).

## License and disclaimer

MIT (see [LICENSE](LICENSE)).

> This is an independent tool built to help Marines with administrative
> work. It is not an official Department of the Navy or U.S. Marine Corps
> system and is not endorsed by, affiliated with, or approved by either.
> Always confirm requirements against the current governing orders.

## Part of Semper Admin

One of the tools in the Semper Admin suite. Start at the
[Semper Admin Portal](https://semper-admin-portal.app.cloud.gov) for the
full set.
