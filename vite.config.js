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
