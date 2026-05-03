import type { Difficulty } from "./types";

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

export function DifficultyToggle({ value, onChange }: Props) {
  return (
    <div
      className="lineage-difficulty"
      role="radiogroup"
      aria-label="Difficulty"
    >
      <button
        className={`lineage-diff-tab ${value === "easy" ? "active" : ""}`}
        onClick={() => onChange("easy")}
        role="radio"
        aria-checked={value === "easy"}
      >
        <span className="mode-tab-label">Easy</span>
        <span className="mode-tab-hint">Any president</span>
      </button>
      <button
        className={`lineage-diff-tab ${value === "hard" ? "active" : ""}`}
        onClick={() => onChange("hard")}
        role="radio"
        aria-checked={value === "hard"}
      >
        <span className="mode-tab-label">Hard</span>
        <span className="mode-tab-hint">Within ±20</span>
      </button>
    </div>
  );
}
