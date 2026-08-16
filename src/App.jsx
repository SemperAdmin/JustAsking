import { useCallback, useEffect, useState } from 'react'

import CardCreator from './components/CardCreator'
import CardResult from './components/CardResult'
import CardViewer from './components/CardViewer'
import Layout from './components/Layout'
import { DEFAULT_ROLE } from './constants'
import { decodeState, isComplete } from './utils/urlState'

/** True when there is a fragment worth trying to decode. */
function hasHash() {
  return window.location.hash.replace('#', '').length > 0
}

/**
 * Controller.
 *
 * The URL fragment is the only source of truth for which view is showing:
 *
 *   no hash                  -> <CardCreator/>  somebody is starting a card
 *   hash, a question open    -> <CardViewer/>   somebody was asked something
 *   hash, every one answered -> <CardResult/>   the answers came back
 *
 * A hash that fails to decode is treated as no hash at all, with a note
 * explaining why -- links get truncated by chat apps often enough that a blank
 * screen would be the wrong answer.
 */
export default function App() {
  const [card, setCard] = useState(() => decodeState(window.location.hash))
  const [linkWasBroken, setLinkWasBroken] = useState(() => hasHash() && !decodeState(window.location.hash))

  // Accent shown while the creator is open, before any card exists.
  const [draftRole, setDraftRole] = useState(DEFAULT_ROLE)

  // Keep the view in step with the address bar: the back button after a reset,
  // or someone pasting a different card into the same tab.
  useEffect(() => {
    function syncFromHash() {
      const next = decodeState(window.location.hash)
      setCard(next)
      setLinkWasBroken(hasHash() && !next)
    }

    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  const handleReset = useCallback(() => {
    // replaceState avoids leaving the spent card one Back press away, and unlike
    // `location.hash = ''` it does not leave a bare '#' behind.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    setCard(null)
    setLinkWasBroken(false)
  }, [])

  const role = card?.t ?? draftRole

  return (
    <Layout role={role}>
      {card === null ? (
        <>
          {linkWasBroken ? (
            <div className="mb-4 rounded-card border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
              That link couldn&rsquo;t be read &mdash; it was probably cut short in transit. Ask
              whoever sent it to paste the whole thing, or start your own card below.
            </div>
          ) : null}
          <CardCreator onRoleChange={setDraftRole} />
        </>
      ) : isComplete(card) ? (
        <CardResult card={card} onReset={handleReset} />
      ) : (
        <CardViewer card={card} />
      )}
    </Layout>
  )
}
