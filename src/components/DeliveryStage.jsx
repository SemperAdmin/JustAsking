/**
 * The scenery for each delivery style. Markup only -- justasking.css drives
 * every sequence, keyed off `data-delivery` and `data-phase` on an ancestor.
 *
 * This lives apart from <Delivery/> because the creator's preview renders the
 * same scenery. Two copies would drift the first time a style was retouched.
 */
const STAGES = {
  env: (
    <>
      {/* Back to front: back panel, letter, front panel, flap, seal. */}
      <div className="env__back" />
      <div className="env__letter paper-ruled" />
      <div className="env__front" />
      <div className="env__flap" />
      <div className="env__seal">
        <span className="env__wax env__wax--l" aria-hidden="true">
          <span className="env__sigil">SA</span>
        </span>
        <span className="env__wax env__wax--r" aria-hidden="true">
          <span className="env__sigil">SA</span>
        </span>
      </div>
    </>
  ),
  stamp: (
    <>
      <div className="stamp__page paper-ruled" />
      <div className="stamp__mark">FOR ACTION</div>
    </>
  ),
  wire: (
    <div className="wire__panel">
      <p className="wire__label">INCOMING</p>
      <div className="wire__bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="wire__scan" aria-hidden="true" />
    </div>
  ),
  scroll: (
    <>
      <div className="scroll__body paper-ruled" />
      <div className="scroll__rod scroll__rod--top" />
      <div className="scroll__rod scroll__rod--bottom" />
      <div className="scroll__cord" />
    </>
  ),
}

export default function DeliveryStage({ id }) {
  return <div className="delivery__stage">{STAGES[id] ?? STAGES.env}</div>
}
