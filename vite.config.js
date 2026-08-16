import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
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
})
