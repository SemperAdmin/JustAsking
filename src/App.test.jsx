import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { decodeState, encodeState } from './utils/urlState'

afterEach(cleanup)

beforeEach(() => {
  // Open the delivery instantly. The sequence is a timed animation worth about
  // 1.2 seconds per card, and these tests are about state carried between
  // cards, not about the seal.
  localStorage.setItem('justasking:motion', 'skip')
})

/** Put a card in the fragment and tell the app about it, as a paste would. */
async function navigateTo(cardObject) {
  await act(async () => {
    window.location.hash = `#${encodeState(cardObject).split('#')[1]}`
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

/** The payload the app is currently offering to send back, if any. */
function replyPayload() {
  const field = document.querySelector('input[readonly]')
  return field ? field.value.split('#')[1] : null
}

describe('answering a card', () => {
  it('carries nothing from a previous card into the next reply', { timeout: 20000 }, async () => {
    // Regression guard for a confirmed leak. <CardViewer/> seeds its answers and
    // its step once, at mount. Before the fragment became its key, React reused
    // the mounted instance across a hash change, so a second card rendered with
    // the first card's answers still in state -- and the app offered to send a
    // private free-text answer, given to one sender, back to a different one.
    const user = userEvent.setup()

    const privateCard = { t: 'env', q: [{ p: 'What is your home address?', k: 'x', a: '' }] }
    const strangerCard = { t: 'env', q: [{ p: 'Pizza or tacos?', k: 'x', a: '' }] }
    const secret = '123 Private Lane'

    window.location.hash = `#${encodeState(privateCard).split('#')[1]}`
    render(<App />)

    await user.click(screen.getByRole('button', { name: /break the seal/i }))
    await user.type(await screen.findByRole('textbox'), secret)
    await user.click(screen.getByRole('button', { name: /^done$/i }))
    await waitFor(() => expect(replyPayload()).not.toBeNull())

    // A different sender's card lands in the same tab.
    await navigateTo(strangerCard)

    // It arrives sealed, exactly as a first visit would.
    await user.click(await screen.findByRole('button', { name: /break the seal/i }))
    await screen.findByText(/pizza or tacos/i)

    // Its answer box is empty, and there is nothing to send back yet.
    expect(screen.getByRole('textbox').value).toBe('')
    expect(replyPayload()).toBeNull()

    const everythingOnScreen = document.body.textContent
    expect(everythingOnScreen).not.toContain(secret)
    expect(everythingOnScreen).not.toContain('home address')
  })

  it('offers a reply carrying only the answer given to this card', { timeout: 20000 }, async () => {
    const user = userEvent.setup()
    const card = { t: 'env', q: [{ p: 'Pizza or tacos?', k: 'x', a: '' }] }

    window.location.hash = `#${encodeState(card).split('#')[1]}`
    render(<App />)

    await user.click(screen.getByRole('button', { name: /break the seal/i }))
    await user.type(await screen.findByRole('textbox'), 'Tacos')
    await user.click(screen.getByRole('button', { name: /^done$/i }))
    await waitFor(() => expect(replyPayload()).not.toBeNull())

    expect(decodeState(`#${replyPayload()}`)).toEqual({
      t: 'env',
      q: [{ p: 'Pizza or tacos?', k: 'x', a: 'Tacos' }],
    })
  })
})
