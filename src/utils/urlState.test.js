import { describe, expect, it } from 'vitest'

import {
  MAX_OPTIONS,
  MAX_PROMPT_LENGTH,
  MAX_QUESTIONS,
  MAX_TEXT_ANSWER_LENGTH,
  URL_LENGTH_HARD_MAX,
} from '../constants'
import {
  decodeState,
  encodeState,
  isComplete,
  projectedAnsweredLength,
  sanitizeState,
} from './urlState'

const card = (questions) => ({ t: 'env', q: questions })
const text = (overrides = {}) => ({ p: 'How are you?', k: 'x', a: '', ...overrides })
const choice = (overrides = {}) => ({ p: 'Yes or no?', k: 'c', o: ['Yes', 'No'], a: '', ...overrides })

/** Deterministic-free filler, so the tests exercise real entropy. */
function noise(length, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/') {
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

describe('sanitizeState', () => {
  it('rejects anything that is not an object of questions', () => {
    for (const junk of [null, undefined, 42, 'hello', [], {}, { q: [] }, { q: 'x' }]) {
      expect(sanitizeState(junk)).toBeNull()
    }
  })

  it('drops a question with no prompt', () => {
    expect(sanitizeState(card([{ p: '   ', k: 'x', a: '' }]))).toBeNull()
  })

  it('drops a choice question with no options left after cleaning', () => {
    expect(sanitizeState(card([choice({ o: ['', '   ', 7, null] })]))).toBeNull()
  })

  it('clips a prompt to the limit and strips control characters', () => {
    const out = sanitizeState(card([text({ p: `a\u0007b\nc${'x'.repeat(400)}` })]))
    expect(out.q[0].p.length).toBe(MAX_PROMPT_LENGTH)
    expect(out.q[0].p).not.toMatch(/[\u0000-\u001F\u007F]/)
  })

  it('caps the number of questions and the number of options', () => {
    const many = Array.from({ length: MAX_QUESTIONS + 4 }, () => choice({ o: Array.from({ length: MAX_OPTIONS + 3 }, (_, i) => `Opt ${i}`) }))
    const out = sanitizeState(card(many))
    expect(out.q).toHaveLength(MAX_QUESTIONS)
    expect(out.q[0].o).toHaveLength(MAX_OPTIONS)
  })

  it('refuses a choice answer never offered as an option', () => {
    const out = sanitizeState(card([choice({ a: 'Maybe' })]))
    expect(out.q[0].a).toBe('')
  })

  it('keeps a choice answer drawn from the offered options', () => {
    expect(sanitizeState(card([choice({ a: 'No' })])).q[0].a).toBe('No')
  })

  it('refuses a date that is well-formed but not a real day', () => {
    for (const bad of ['2026-02-31', '2026-13-01', '2026-00-10', '26-01-01', 'tomorrow', '2026-01-01T99:00']) {
      const out = sanitizeState(card([{ p: 'When?', k: 'd', a: bad }]))
      expect(out.q[0].a).toBe('')
    }
  })

  it('keeps a real date and a real date-time', () => {
    expect(sanitizeState(card([{ p: 'When?', k: 'd', a: '2026-02-28' }])).q[0].a).toBe('2026-02-28')
    expect(sanitizeState(card([{ p: 'When?', k: 'dt', a: '2026-02-28T23:59' }])).q[0].a).toBe('2026-02-28T23:59')
  })

  it('clips a free-text answer to the limit', () => {
    const out = sanitizeState(card([text({ a: noise(500) })]))
    expect(out.q[0].a.length).toBe(MAX_TEXT_ANSWER_LENGTH)
  })

  it('falls back on an unknown kind and an unknown delivery style', () => {
    const out = sanitizeState({ t: 'not-a-style', q: [{ p: 'Hi?', k: 'zzz', o: ['A'], a: '' }] })
    expect(out.t).toBe('env')
    expect(out.q[0].k).toBe('c')
  })

  it('lifts a legacy single-question payload into the current shape', () => {
    const out = sanitizeState({ t: 'env', q: 'Coffee?', o: ['Yes', 'No'], a: 'Yes' })
    expect(out.q).toHaveLength(1)
    expect(out.q[0]).toMatchObject({ p: 'Coffee?', k: 'c', a: 'Yes' })
  })
})

describe('decodeState', () => {
  it('returns null for nothing, junk, and a truncated link', () => {
    expect(decodeState('')).toBeNull()
    expect(decodeState('#')).toBeNull()
    expect(decodeState(null)).toBeNull()
    expect(decodeState('#not-a-real-payload')).toBeNull()
    const full = encodeState(card([choice()])).split('#')[1]
    expect(decodeState(`#${full.slice(0, full.length - 4)}`)).toBeNull()
  })

  it('round-trips a card through the fragment', () => {
    const original = card([choice({ a: 'Yes' }), text({ a: 'Fine' })])
    const decoded = decodeState(`#${encodeState(original).split('#')[1]}`)
    expect(decoded).toEqual(original)
  })
})

describe('isComplete', () => {
  it('is false until every question carries an answer', () => {
    expect(isComplete(null)).toBe(false)
    expect(isComplete(card([choice({ a: 'Yes' }), text()]))).toBe(false)
    expect(isComplete(card([choice({ a: 'Yes' }), text({ a: 'Fine' })]))).toBe(true)
  })
})

describe('projectedAnsweredLength', () => {
  // Regression guard. The projection once filled every free-text answer with
  // one identical string, so LZ-String collapsed answers two onward to a
  // back-reference and a five-question card projected at roughly one question's
  // worth of reply. The creator then minted cards whose real reply overran the
  // ceiling it had promised.
  it('never under-measures a real reply', () => {
    for (let n = 1; n <= MAX_QUESTIONS; n++) {
      for (let trial = 0; trial < 40; trial++) {
        const questions = Array.from({ length: n }, () => text({ p: noise(MAX_PROMPT_LENGTH) }))
        const projected = projectedAnsweredLength(card(questions))
        const real = encodeState(
          card(questions.map((question) => ({ ...question, a: noise(MAX_TEXT_ANSWER_LENGTH) }))),
        ).length
        expect(projected).toBeGreaterThanOrEqual(real)
      }
    }
  })

  it('holds the sendable-means-returnable guarantee under the hard ceiling', () => {
    let accepted = 0
    for (let n = 1; n <= MAX_QUESTIONS; n++) {
      for (let trial = 0; trial < 40; trial++) {
        const questions = Array.from({ length: n }, () => text({ p: noise(MAX_PROMPT_LENGTH) }))
        if (projectedAnsweredLength(card(questions)) > URL_LENGTH_HARD_MAX) continue
        accepted++
        const real = encodeState(
          card(questions.map((question) => ({ ...question, a: noise(MAX_TEXT_ANSWER_LENGTH) }))),
        ).length
        expect(real).toBeLessThanOrEqual(URL_LENGTH_HARD_MAX)
      }
    }
    expect(accepted).toBeGreaterThan(0)
  })

  it('measures a choice card exactly, since its answers are already in the payload', () => {
    const questions = [choice({ o: ['Alpha', 'Bravo', 'Charlie'] }), choice({ o: ['Yes', 'No'] })]
    const projected = projectedAnsweredLength(card(questions))
    const real = encodeState(card([
      { ...questions[0], a: 'Charlie' },
      { ...questions[1], a: 'Yes' },
    ])).length
    expect(projected).toBe(real)
  })
})
