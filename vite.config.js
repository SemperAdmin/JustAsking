import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import pkg from './package.json' with { type: 'json' }

// Build stamp for the footer. Read at config time so the value is fixed when
// the artifact is produced, not when the page is opened.
const BUILD_DATE = new Date().toISOString().slice(0, 10)

export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __APP_VERSION__: JSON.stringify(`v${pkg.version}`),
  },

  // Relative base so the built app works from any static host or subpath,
  // including a GitHub Pages project page served from /JustAsking/.
  base: './',

  build: {
    // Vite's default target assumes a recent browser and emits syntax such as
    // `??=` and `?.` untouched. A single unparseable token takes down the whole
    // module, which surfaces as a blank page with nothing in the console --
    // especially in the older WebViews that in-app browsers use. Lowering the
    // target trades a few hundred bytes for a much wider set of browsers.
    target: ['es2017', 'safari12', 'chrome64', 'firefox67'],

    // Emit every asset as a file. Vite's default inlines anything under 4 kB as
    // a data: URI, which quietly pulled one of the brand woff2 faces into the
    // stylesheet -- and a data: font is only loadable if the Content Security
    // Policy shipped with the cloud.gov deployment widens font-src to accept
    // `data:`. Paying one extra HTTP/2 request for a few kB buys back a policy
    // with no data: source in it at all. Verified: with this at 0, the built
    // site loads clean under `default-src 'none'` plus `font-src 'self'`.
    assetsInlineLimit: 0,
  },

  plugins: [react(), tailwindcss()],

  // Vitest transforms JSX with esbuild rather than through the React plugin, and
  // esbuild's default is the classic runtime, which expects React in scope.
  // Every component here relies on the automatic runtime.
  esbuild: {
    jsx: 'automatic',
  },

  test: {
    // The payload logic reads window.location and the component tests drive a
    // real DOM, so both need a browser-shaped environment.
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
  },
})
