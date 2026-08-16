/**
 * Render a stored answer for display.
 *
 * Choice and text answers are already what the reader typed or picked. Dates
 * are stored in the input's own wire format (`2026-08-21`, `2026-08-21T14:30`)
 * which is unambiguous but not something to show anyone, so they are formatted
 * to the reader's locale.
 *
 * The date is built from its parts rather than parsed from the string:
 * `new Date('2026-08-21')` is interpreted as UTC and renders as the 20th for
 * anyone west of Greenwich, which would misreport the answer by a day.
 */
export default function formatAnswer(question) {
  const { k, a } = question
  if (!a) return ''
  if (k !== 'd' && k !== 'dt') return a

  const [datePart, timePart] = a.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = (timePart ?? '00:00').split(':').map(Number)
  const when = new Date(y, m - 1, d, hh, mm)

  if (Number.isNaN(when.getTime())) return a

  const date = when.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (k === 'd') return date

  const time = when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${date}, ${time}`
}
