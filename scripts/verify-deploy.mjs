#!/usr/bin/env node
/**
 * Pre-deploy gate for the cloud.gov push.
 *
 * Three things go wrong between `npm run build` and `cf push`, and none of them
 * announce themselves. The buildpack stages cleanly with an empty root and
 * serves 404 for every request. A stale dist survives a push and looks live. An
 * edit to an inline script in index.html silently invalidates the CSP hash, and
 * the browser blocks the script at runtime rather than the build failing.
 *
 * Run before every push. Exits non-zero with the specific failure.
 */
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const failures = []

function fail(message) {
  failures.push(message)
}

/** Read a file, or record why it is missing. */
function read(relative, hint) {
  try {
    return readFileSync(resolve(root, relative), 'utf8')
  } catch {
    fail(`${relative} is missing. ${hint}`)
    return null
  }
}

// 1. dist/ exists and holds a built page.
const builtHtml = read('dist/index.html', 'Run `npm run build` first.')

if (builtHtml) {
  if (!/<script[^>]*\bsrc="\.\/assets\//.test(builtHtml)) {
    fail(
      'dist/index.html does not reference a bundled ./assets/ script. ' +
        'This looks like the source entry point rather than a build output.',
    )
  }

  // 2. dist/ is newer than the sources it came from. A stale build pushes fine
  //    and looks live, which is the worst failure mode of the three.
  const builtAt = statSync(resolve(root, 'dist/index.html')).mtimeMs
  const sources = ['src', 'index.html', 'vite.config.js', 'package.json']
  for (const source of sources) {
    let newest = 0
    const walk = (path) => {
      const info = statSync(path)
      if (info.isDirectory()) {
        for (const entry of readdirSync(path)) walk(resolve(path, entry))
        return
      }
      if (info.mtimeMs > newest) newest = info.mtimeMs
    }
    try {
      walk(resolve(root, source))
    } catch {
      continue
    }
    if (newest > builtAt) {
      fail(`${source} changed after the last build. Run \`npm run build\` again.`)
    }
  }
}

// 3. Every inline script in the built page is pinned in the CSP.
const conf = read(
  'nginx/conf/includes/security_headers.conf',
  'The cloud.gov response headers live there.',
)

if (builtHtml && conf) {
  const inline = [...builtHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]

  if (inline.length === 0) fail('Found no inline scripts in dist/index.html. Expected two.')

  for (const [, body] of inline) {
    const digest = `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`
    if (!conf.includes(digest)) {
      fail(
        `An inline script in dist/index.html is not pinned in the CSP.\n` +
          `      Add '${digest}' to script-src in nginx/conf/includes/security_headers.conf.\n` +
          `      First line: ${body.trim().split('\n')[0].slice(0, 60)}`,
      )
    }
  }

  // A hash left in the policy after its script was deleted is dead weight, and
  // dead weight in a security policy is how the policy stops being read.
  const pinned = [...conf.matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)].map((match) => match[1])
  const live = new Set(
    inline.map(([, body]) => `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`),
  )
  for (const hash of pinned) {
    if (!live.has(hash)) fail(`CSP pins '${hash}', which matches no script in dist/index.html.`)
  }
}

if (failures.length > 0) {
  console.error('\nDeploy blocked:\n')
  for (const message of failures) console.error(`  - ${message}`)
  console.error('')
  process.exit(1)
}

console.log('Deploy checks passed. dist/ is fresh and every inline script is pinned in the CSP.')
