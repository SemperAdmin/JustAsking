import { useEffect } from 'react'

/**
 * Themed page shell.
 *
 * `data-theme` is the single place a card's `t` value touches presentation.
 * It selects a palette that already exists in themes.css, so a malicious link
 * can pick a look but never supply one.
 */
export default function Layout({ theme = 'default', children }) {
  // The palette also has to reach <html>: the page gradient and base font are
  // set on <body>, and the browser paints the overscroll area from <html>.
  // Setting it only on the wrapper below would leave those on the default theme.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  return (
    <div
      data-theme={theme}
      className="ja-themed flex min-h-screen flex-col items-center justify-center px-4 py-10"
    >
      <main className="w-full max-w-xl">{children}</main>
      <footer className="mt-8 text-center text-xs text-muted">
        JustAsking &middot; everything lives in the link, nothing is stored on a server
      </footer>
    </div>
  )
}

/** The white panel every view sits inside. */
export function Card({ children, className = '' }) {
  return (
    <div
      className={`ja-themed rounded-card border border-edge bg-surface p-6 shadow-xl shadow-black/5 sm:p-8 ${className}`}
    >
      {children}
    </div>
  )
}
