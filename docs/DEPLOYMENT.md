# Deployment detail

Reference for how JustAsking is published. The README has the deployment table.

## GitHub Pages

Published by `.github/workflows/deploy.yml` on every push to `main`.

**Settings, Pages, Source must be set to "GitHub Actions."** With "Deploy from a
branch", GitHub publishes the repository files as they are, and the root
`index.html` is Vite's entry point: it points at `/src/main.jsx`, which a browser
cannot run. The result is a blank page.

That setting also competes with the workflow: both builders run on each push, and
GitHub's branch builder tends to finish last and overwrite the built site. The
workflow reports success either way. If a deploy appears to succeed but the live
page is blank, check this setting first; a `pages build and deployment` run in
the Actions tab means it has reverted.

## cloud.gov

A second target alongside GitHub Pages: Cloud Foundry, staticfile buildpack,
nginx underneath. The route is https://justasking.app.cloud.gov. The **Deploy to
cloud.gov** workflow (`.github/workflows/deploy-cloudgov.yml`) runs on demand: it
installs, tests, builds, runs `npm run verify:deploy`, pushes, and smoke-tests the
live route. The cloud.gov sandbox is managed by the private cloudgov-redeploy
repository.

The build uses relative asset paths (`base: './'` in `vite.config.js`), so one
build serves GitHub Pages, cloud.gov and the filesystem with no switch.

### What gets pushed

`manifest.yml` pushes the repo root, not `dist/`, because the `Staticfile` and
the nginx include have to travel with the site. `.cfignore` drops the source tree,
scripts, workflows and root-level Markdown files. Its patterns
are anchored with a leading slash, since `.cfignore` follows gitignore matching
and a bare `index.html` would otherwise drop `dist/index.html` and publish a
site whose entry point is a 404.

The build never runs on the platform. The staticfile buildpack has no Node
toolchain, and cloud.gov's own guidance is to build in CI. Nothing on the
platform notices a missing or stale `dist/` either: the buildpack would stage
cleanly and serve 404 for every request. `npm run verify:deploy` is the guard
and it covers three failure modes that otherwise stay silent.

- `dist/` absent, or holding the source entry point rather than a build output.
- `dist/` older than `src/`, `index.html`, `vite.config.js`, or `package.json`.
  A stale build pushes fine and looks live, which is the worst of the three.
- An inline script in `index.html` edited without updating its CSP hash. The
  browser blocks the script at runtime and the build stays green.

### Response headers

`nginx/conf/includes/security_headers.conf`, pulled in by `location_include`.

The policy starts at `default-src 'none'` and that is a description rather than
an aspiration: fonts, styles, script, and the emblem are all bundled and served
from this origin, and there is no analytics, no telemetry, and no API.
`connect-src 'none'` states the product's central promise in a form a browser
enforces.

The two inline scripts in `index.html`, the pre-paint colour scheme read and the
ES5 boot diagnostic, are pinned by SHA-256 hash rather than waved through with
`'unsafe-inline'`.

Two honest weaknesses:

- `style-src` carries `'unsafe-inline'`. React writes the per-option animation
  delays in `CardViewer` as inline style attributes, and CSP treats a style
  attribute as inline style. Moving those delays into a stylesheet removes the
  need.
- No per-path cache rule. Expressing one here needs a nested `location`, and
  nginx does not inherit `add_header` into a child declaring its own, so every
  security header would vanish from exactly the responses carrying the
  application code. Asset caching belongs in front of the app.

`build.assetsInlineLimit` is 0 in `vite.config.js` for this policy's sake. The
default inlines assets under 4 kB as data: URIs, which pulled one brand woff2
face into the stylesheet and forced `font-src` to accept `data:`. Emitting every
asset as a file costs one extra HTTP/2 request and buys a policy with no data:
source in it.
