import "./reading-input-fields.css";

export interface ReadingInputValue {
  intention: string;
  useMemories: boolean;
}

/**
 * What a Seeker brings to a transmission: a few lines of their own, and
 * consent for ORIEL to draw on what it remembers of their conversations.
 * Vos reads every transmission before it is sent, so the consent says so.
 */
export default function ReadingInputFields({
  value,
  onChange,
}: {
  value: ReadingInputValue;
  onChange: (v: ReadingInputValue) => void;
}) {
  return (
    <div className="rif">
      <label className="rif-label" htmlFor="rif-intention">
        What is alive in you right now? What would you like ORIEL to speak to?
        <span className="rif-optional">Optional</span>
      </label>
      <textarea
        id="rif-intention"
        className="rif-text"
        rows={3}
        maxLength={600}
        value={value.intention}
        placeholder="A few lines are enough."
        onChange={e => onChange({ ...value, intention: e.target.value })}
      />
      <label className="rif-check" htmlFor="rif-memories">
        <input
          id="rif-memories"
          type="checkbox"
          checked={value.useMemories}
          onChange={e => onChange({ ...value, useMemories: e.target.checked })}
        />
        <span>
          Let ORIEL draw on what it remembers of our conversations.
          <small>It finds the theme that matters most now. Vos Arkana reads every transmission before it reaches you.</small>
        </span>
      </label>
    </div>
  );
}
