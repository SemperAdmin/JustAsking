import useColorScheme from '../hooks/useColorScheme'
import BrandFooter from './BrandFooter'
import BrandHeader from './BrandHeader'

// Stamped at build time by Vite so the footer reports the deployed build
// rather than the moment the page happened to be opened.
const BUILD_DATE = __BUILD_DATE__
const BUILD_VERSION = __APP_VERSION__

/**
 * Page shell.
 *
 * The accent is the brand primary throughout; a card's `t` value now chooses a
 * delivery style rather than a colour, and that selection happens further down
 * in <Delivery/>.
 */
export default function Layout({ children }) {
  const { scheme, toggle } = useColorScheme()

  return (
    <div className="ambient-bloom flex min-h-screen flex-col items-center px-4 py-8 sm:py-12">
      <div className="flex w-full max-w-xl flex-1 flex-col">
        <BrandHeader scheme={scheme} onToggleScheme={toggle} />
        <main className="flex flex-1 flex-col justify-center">{children}</main>
        <BrandFooter version={BUILD_VERSION} buildDate={BUILD_DATE} />
      </div>
    </div>
  )
}

/** The panel every view sits inside. 24px padding per the spacing scale. */
export function Card({ children, className = '', ...rest }) {
  return (
    <div
      className={`rounded-card border border-border bg-card p-5 shadow-card sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
